import base64
import ctypes
import gc
import hashlib
import logging
import os
import re
import shutil
import sys
import threading
import time
import uuid
from typing import Dict, List, Optional

import fitz
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)

_OWNER = re.compile(r"^[A-Za-z0-9:_-]{1,100}$")
_LEGACY_FOLDER = re.compile(r"^doc_[0-9a-f]{32}$")


class _Store:
    """One owner's analysed document (vector DB) and its lifecycle state."""

    def __init__(self):
        self.lock = threading.RLock()
        self.db = None
        self.folder = None
        self.timer = None
        self.last_error = None
        self.last_used = time.monotonic()


def _release_raster_memory():
    """Return disposable OCR/raster buffers to the OS, without lowering image quality.

    OCR is the dominant transient allocation on 512-MiB Linux instances. MuPDF
    caches and glibc freed arenas can accumulate across scanned pages even after
    a Pixmap has been deleted. This runs only after the page/prompt are released.
    """
    try:
        fitz.TOOLS.store_shrink(100)
    except (AttributeError, RuntimeError):
        logger.debug('MuPDF cache shrink unavailable', exc_info=True)
    gc.collect()
    if sys.platform == 'linux':
        try:
            malloc_trim = ctypes.CDLL(None).malloc_trim
            malloc_trim.argtypes = [ctypes.c_size_t]
            malloc_trim.restype = ctypes.c_int
            malloc_trim(0)
        except (AttributeError, OSError):
            # Works without glibc, including non-Linux developer machines.
            pass


class DocumentService:
    """
    Per-user document service.

    Every owner (the verified user id from the Node API, e.g. "<userId>" for chat
    or "<userId>:draft" for draft uploads) has its own Chroma folder
    (temp_db/doc_<sha256(owner)[:32]>_<uuid>) and its own in-memory handle. One
    user's upload, question or cleanup never reads, replaces or deletes another
    user's document. Folders are removed after DOCUMENT_DB_TTL_SECONDS (default 2 h).

    Note: state is process-local. With several workers/instances, route a user to
    the same instance or move vector data to shared storage.
    """

    def __init__(self):
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.db_dir = os.getenv("DOCUMENT_DB_DIR", "temp_db")
        self.max_open = max(1, int(os.getenv("DOCUMENT_MAX_OPEN", "20")))
        self.ttl_seconds = int(os.getenv("DOCUMENT_DB_TTL_SECONDS", "7200"))
        self._stores: Dict[str, _Store] = {}
        self._registry_lock = threading.Lock()
        self.llm_vision = ChatOpenAI(model="gpt-4o-mini", temperature=0, max_tokens=3000)
        self.llm_answer = ChatOpenAI(model="gpt-4o", temperature=0.2, max_tokens=2500)
        self.llm_timeline = ChatOpenAI(model="gpt-4o", temperature=0, max_tokens=3000)
        self._remove_legacy_shared_folders()

    # ------------------------------------------------------------------
    # Owner helpers
    # ------------------------------------------------------------------
    @staticmethod
    def owner_key(owner: str) -> str:
        if not isinstance(owner, str) or not _OWNER.match(owner):
            raise ValueError("Invalid document owner.")
        return hashlib.sha256(owner.encode("utf-8")).hexdigest()[:32]

    def _store(self, owner: str) -> _Store:
        key = self.owner_key(owner)
        with self._registry_lock:
            return self._stores.setdefault(key, _Store())

    def last_error_for(self, owner: str) -> Optional[str]:
        try:
            key = self.owner_key(owner)
        except ValueError:
            return None
        store = self._stores.get(key)
        return store.last_error if store else None

    def _owner_folders(self, owner: str) -> List[str]:
        prefix = f"doc_{self.owner_key(owner)}_"
        if not os.path.isdir(self.db_dir):
            return []
        return [os.path.join(self.db_dir, entry) for entry in os.listdir(self.db_dir)
                if entry.startswith(prefix) and os.path.isdir(os.path.join(self.db_dir, entry))]

    def _remove_legacy_shared_folders(self):
        """Folders from the old single-document design belong to no one; delete them."""
        if not os.path.isdir(self.db_dir):
            return
        for entry in os.listdir(self.db_dir):
            path = os.path.join(self.db_dir, entry)
            if _LEGACY_FOLDER.match(entry) and os.path.isdir(path):
                shutil.rmtree(path, ignore_errors=True)

    # ------------------------------------------------------------------
    # Chroma lifecycle helpers (scoped to one store; never process-wide)
    # ------------------------------------------------------------------
    @staticmethod
    def _forget_cached_client(folder: Optional[str]):
        """Drop only this folder's entry from Chroma's client cache. Clearing the
        whole cache would stop every other user's open database."""
        if not folder:
            return
        try:
            try:
                from chromadb.api.shared_system_client import SharedSystemClient
            except ImportError:
                from chromadb.api.client import SharedSystemClient
            cache = getattr(SharedSystemClient, "_identifier_to_system", None)
            if isinstance(cache, dict):
                for identifier in {folder, os.path.abspath(folder)}:
                    cache.pop(identifier, None)
        except Exception:
            logger.debug("Could not drop cached Chroma client", exc_info=True)

    def _release(self, store: _Store):
        db, store.db = store.db, None
        if db is not None:
            try:
                client = getattr(db, "_client", None)
                system = getattr(client, "_system", None)
                if system is not None:
                    system.stop()
            except Exception:
                logger.debug("Could not stop Chroma system", exc_info=True)
        self._forget_cached_client(store.folder)
        gc.collect()

    def _schedule_cleanup(self, owner: str, store: _Store, folder: str):
        if store.timer is not None:
            store.timer.cancel()

        def cleanup():
            with store.lock:
                # Never delete a newer document of the same owner.
                if store.folder and os.path.abspath(folder) == os.path.abspath(store.folder):
                    self._release(store)
                    shutil.rmtree(folder, ignore_errors=True)
                    store.folder = None
                    logger.info("Temporary document database cleaned up.")

        store.timer = threading.Timer(self.ttl_seconds, cleanup)
        store.timer.daemon = True
        store.timer.start()

    def _enforce_open_limit(self, keep: _Store):
        """Close (but keep on disk) the least recently used open databases."""
        with self._registry_lock:
            open_stores = [s for s in self._stores.values() if s.db is not None and s is not keep]
        excess = len(open_stores) + 1 - self.max_open
        for store in sorted(open_stores, key=lambda s: s.last_used)[:max(0, excess)]:
            if store.lock.acquire(blocking=False):
                try:
                    self._release(store)
                finally:
                    store.lock.release()

    # ------------------------------------------------------------------
    # OCR
    # ------------------------------------------------------------------
    def _perform_vision_ocr(self, file_path: str) -> List[Document]:
        logger.info("Starting vision OCR for %s", file_path)
        extracted = []
        with fitz.open(file_path) as pdf:
            page_count = len(pdf)
            if page_count > int(os.getenv("OCR_MAX_PAGES", "100")):
                raise ValueError("PDF exceeds the 100-page OCR limit. Split the document.")
            for page_index in range(page_count):
                page = pdf.load_page(page_index)
                pix = page.get_pixmap(matrix=fitz.Matrix(1.7, 1.7), colorspace=fitz.csGRAY, alpha=False)
                image_bytes = pix.tobytes("png")
                del pix  # Release decoded RGB pixels before base64/SDK serialization.
                encoded = base64.b64encode(image_bytes).decode("ascii")
                del image_bytes
                prompt = HumanMessage(content=[
                    {
                        "type": "text",
                        "text": (
                            "You are an OCR specialist for Indian legal documents. Extract all "
                            "visible text from this page, preserving the original language "
                            "(English, Hindi, or Marathi), names, dates, numbers, case numbers, "
                            "and legal provisions. Do not invent illegible text; mark it [UNCLEAR]. "
                            "Return extracted text only. Page number: " + str(page_index + 1)
                        ),
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{encoded}",
                            "detail": "high",
                        },
                    },
                ])
                del encoded  # The prompt now owns the only required image string.
                try:
                    result = self.llm_vision.invoke([prompt])
                    content = result.content if isinstance(result.content, str) else str(result.content)
                    extracted.append(Document(
                        page_content=content,
                        metadata={"page": page_index + 1, "source": "Vision-OCR", "file": os.path.basename(file_path)},
                    ))
                    logger.info("OCR page %s/%s completed", page_index + 1, page_count)
                except Exception as exc:
                    logger.exception("OCR failed on page %s", page_index + 1)
                    extracted.append(Document(
                        page_content=f"[OCR failed on page {page_index + 1}: {exc}]",
                        metadata={"page": page_index + 1, "source": "OCR-Failed"},
                    ))
                finally:
                    del prompt  # Do not retain the previous page during the next raster.
                    del page
                    # Keep the *same* lossless PNG and OCR resolution; reclaim
                    # native raster caches before processing the next page.
                    if 'result' in locals():
                        del result
                    _release_raster_memory()
                time.sleep(0.2)
        return extracted

    # ------------------------------------------------------------------
    # Indexing (per owner)
    # ------------------------------------------------------------------
    def process_pdf(self, file_path: str, owner: str):
        store = self._store(owner)
        with store.lock:
            store.last_error = None
            try:
                if not os.path.isfile(file_path):
                    raise FileNotFoundError("Uploaded PDF could not be found on the server.")

                loader = PyMuPDFLoader(file_path)
                pages = loader.load()
                all_text = "\n".join(page.page_content for page in pages).strip()

                # Trigger OCR for image-only/scanned documents.
                if len(all_text) < 100:
                    pages = self._perform_vision_ocr(file_path)

                usable_pages = [
                    page for page in pages
                    if page.page_content and not page.page_content.startswith("[OCR failed")
                ]
                if not usable_pages or not any(len(p.page_content.strip()) > 0 for p in usable_pages):
                    raise ValueError("No readable text could be extracted from this PDF.")

                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=1500,
                    chunk_overlap=250,
                    separators=["\n\n", "\n", "।", ".", " "],
                )
                chunks = splitter.split_documents(usable_pages)
                if not chunks:
                    raise ValueError("No text chunks were created from this PDF.")

                # Replace only THIS owner's previous document.
                self._release(store)
                if store.timer is not None:
                    store.timer.cancel()
                for folder in self._owner_folders(owner):
                    shutil.rmtree(folder, ignore_errors=True)
                store.folder = None

                os.makedirs(self.db_dir, exist_ok=True)
                new_dir = os.path.join(self.db_dir, f"doc_{self.owner_key(owner)}_{uuid.uuid4().hex}")
                os.makedirs(new_dir, exist_ok=True)

                store.db = Chroma.from_documents(
                    documents=chunks,
                    embedding=self.embeddings,
                    persist_directory=new_dir,
                    collection_name=f"legal_doc_{uuid.uuid4().hex[:10]}",
                    collection_metadata={"hnsw:space": "cosine"},
                )
                store.db._collection.count()   # verify the collection is usable
                store.folder = new_dir
                store.last_used = time.monotonic()
                self._schedule_cleanup(owner, store, new_dir)
                logger.info("PDF indexed: %s pages, %s chunks", len(usable_pages), len(chunks))
                db = store.db
            except Exception as exc:
                store.last_error = str(exc)
                logger.exception("PDF processing failed: %s", exc)
                self._release(store)
                return None
        self._enforce_open_limit(store)
        return db

    def get_db(self, owner: str):
        """The owner's analysed document, reloaded from disk after a restart; else None."""
        store = self._store(owner)
        with store.lock:
            if store.db is not None:
                try:
                    store.db._collection.count()
                    store.last_used = time.monotonic()
                    return store.db
                except Exception:
                    logger.warning("Document DB is unavailable", exc_info=True)
                    self._release(store)
            folders = self._owner_folders(owner)
            if not folders:
                return None
            folder = max(folders, key=os.path.getmtime)
            try:
                import chromadb

                client = chromadb.PersistentClient(path=folder)
                collections = client.list_collections()
                if not collections:
                    return None
                first = collections[0]
                store.folder = folder
                store.db = Chroma(
                    client=client,
                    embedding_function=self.embeddings,
                    collection_name=first if isinstance(first, str) else first.name,
                )
                store.db._collection.count()
                store.last_used = time.monotonic()
                if store.timer is None:
                    self._schedule_cleanup(owner, store, folder)
                db = store.db
            except Exception as exc:
                store.last_error = str(exc)
                logger.exception("Could not reload document database")
                self._release(store)
                return None
        self._enforce_open_limit(store)
        return db

    # ------------------------------------------------------------------
    # Analysis
    # ------------------------------------------------------------------
    def get_timeline(self, vector_db):
        if vector_db is None:
            return "Analysis failed. Document could not be read."
        try:
            queries = [
                "dates incidents events chronology timeline",
                "marriage date FIR complaint filing court order",
                "first incident second incident assault attack",
                "registration date agreement property transaction",
                "case number court name order date parties",
            ]
            all_docs, seen = [], set()
            for query in queries:
                try:
                    for doc in vector_db.similarity_search(query, k=5):
                        key = doc.page_content[:160]
                        if key not in seen:
                            seen.add(key)
                            all_docs.append(doc)
                except Exception:
                    logger.warning("Timeline retrieval query failed: %s", query, exc_info=True)

            if not all_docs:
                return "Could not retrieve document content for timeline generation."

            context = "\n\n".join(
                f"[PAGE {doc.metadata.get('page', '?')}]\n{doc.page_content}"
                for doc in all_docs
            )
            system = SystemMessage(content=(
                "You are a careful Indian legal case analyst. Create a chronology from the supplied "
                "document excerpts only. Never invent dates or events. Clearly mark missing or unclear dates."
            ))
            human = HumanMessage(content=f"""
Create a chronological timeline from the legal document excerpts.

Rules:
- Format each event as: [DD/MM/YYYY or Date unclear] — Event — (Ref: Page X)
- Group entries into Pre-Incident, Incident, Post-Incident, and Legal Proceedings when applicable.
- Preserve names, locations, amounts, case numbers, and legal provisions exactly as shown.
- If an event or date is uncertain, state that it is uncertain.
- Do not fabricate a minimum number of events; include only supported events.
- End with KEY PARTIES IDENTIFIED.

DOCUMENT EXCERPTS:
{context}
""")
            response = self.llm_timeline.invoke([system, human])
            return response.content
        except Exception as exc:
            logger.exception("Timeline generation failed")
            return f"Timeline generation failed: {exc}"

    def ask_question(self, vector_db, query: str, history: Optional[List[dict]] = None, owner: Optional[str] = None):
        if vector_db is None:
            return "No document database is loaded. Please upload and analyze a PDF first."
        history = history or []
        try:
            try:
                vector_db._collection.count()
            except Exception:
                recovered = self.get_db(owner) if owner else None
                if recovered is None:
                    return "The document database is unavailable. Please re-upload the PDF."
                vector_db = recovered

            docs = vector_db.similarity_search(query, k=7)
            if not docs:
                return "The uploaded document does not contain information relevant to this question."

            context = "\n\n".join(
                f"[PAGE {doc.metadata.get('page', '?')}]\n{doc.page_content}"
                for doc in docs
            )
            history_text = "\n".join(
                f"{'User' if item.get('role') == 'user' else 'Assistant'}: "
                f"{item.get('content') or item.get('text') or ''}"
                for item in history[-6:]
                if item.get("content") or item.get("text")
            )
            system = SystemMessage(content="""You are a careful Indian legal document assistant.
Answer only from the supplied document excerpts. Do not hallucinate facts, dates, provisions, or case citations.
Answer in the same language as the question (English, Hindi, Marathi, or mixed language).
Cite the page for document-based claims as (Ref: Page X). If information is absent, explicitly say it is not mentioned in the uploaded document.
For legal analysis, distinguish facts stated in the document from general legal interpretation.""")
            human = HumanMessage(content=f"""
DOCUMENT EXCERPTS (source of truth):
{context}

RECENT CONVERSATION:
{history_text or "No previous conversation"}

QUESTION:
{query}

Give a clear, useful answer with page references for document facts.
""")
            response = self.llm_answer.invoke([system, human])
            return response.content
        except Exception as exc:
            logger.exception("PDF question answering failed")
            if owner:
                self._store(owner).last_error = str(exc)
