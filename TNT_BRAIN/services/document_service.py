import base64
import gc
import logging
import os
import shutil
import threading
import time
import uuid
from pathlib import Path
from typing import List, Optional

import fitz
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

logger = logging.getLogger(__name__)


class DocumentService:
    """
    Single-active-document service for the current app architecture.
    Note: this is process-local state; for multi-worker/multi-instance production,
    store document/session IDs and vector data in shared storage.
    """

    def __init__(self):
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.db_dir = os.getenv("DOCUMENT_DB_DIR", "temp_db")
        self._db_lock = threading.RLock()
        self._cleanup_timer = None
        self.active_db = None
        self.last_error = None
        self.llm_vision = ChatOpenAI(model="gpt-4o-mini", temperature=0, max_tokens=3000)
        self.llm_answer = ChatOpenAI(model="gpt-4o", temperature=0.2, max_tokens=2500)
        self.llm_timeline = ChatOpenAI(model="gpt-4o", temperature=0, max_tokens=3000)

    def _close_active_db(self):
        if self.active_db is not None:
            try:
                client = getattr(self.active_db, "_client", None)
                if client and hasattr(client, "close"):
                    client.close()
            except Exception:
                logger.debug("Could not close Chroma client", exc_info=True)
            self.active_db = None
            gc.collect()

    def _cleanup_task(self, folder_path: str, delay: int = 7200):
        if self._cleanup_timer is not None:
            self._cleanup_timer.cancel()

        def cleanup():
            with self._db_lock:
                # Do not delete a newer database if this timer belongs to an old one.
                if os.path.abspath(folder_path) != os.path.abspath(self.db_dir):
                    return
                self._close_active_db()
                try:
                    if os.path.exists(folder_path):
                        shutil.rmtree(folder_path, ignore_errors=False)
                    logger.info("Temporary document database cleaned up.")
                except Exception:
                    logger.warning("Database cleanup failed", exc_info=True)

        self._cleanup_timer = threading.Timer(delay, cleanup)
        self._cleanup_timer.daemon = True
        self._cleanup_timer.start()

    def _perform_vision_ocr(self, file_path: str) -> List[Document]:
        logger.info("Starting vision OCR for %s", file_path)
        extracted = []
        with fitz.open(file_path) as pdf:
            page_count = min(len(pdf), int(os.getenv("OCR_MAX_PAGES", "25")))
            for page_index in range(page_count):
                page = pdf.load_page(page_index)
                pix = page.get_pixmap(matrix=fitz.Matrix(1.7, 1.7), alpha=False)
                image_bytes = pix.tobytes("png")
                encoded = base64.b64encode(image_bytes).decode("ascii")
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
                time.sleep(0.2)
        return extracted

    def process_pdf(self, file_path: str):
        with self._db_lock:
            self.last_error = None
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

                self._close_active_db()
                if self._cleanup_timer is not None:
                    self._cleanup_timer.cancel()

                # A clean folder avoids stale collection data.
                if os.path.exists(self.db_dir):
                    shutil.rmtree(self.db_dir, ignore_errors=False)
                os.makedirs(self.db_dir, exist_ok=True)

                collection_name = f"legal_doc_{uuid.uuid4().hex[:10]}"
                self.active_db = Chroma.from_documents(
                    documents=chunks,
                    embedding=self.embeddings,
                    persist_directory=self.db_dir,
                    collection_name=collection_name,
                    collection_metadata={"hnsw:space": "cosine"},
                )
                # Force a simple DB read to verify that the collection is usable.
                self.active_db._collection.count()
                self._cleanup_task(self.db_dir, delay=int(os.getenv("DOCUMENT_DB_TTL_SECONDS", "7200")))
                logger.info("PDF indexed: %s pages, %s chunks", len(usable_pages), len(chunks))
                return self.active_db
            except Exception as exc:
                self.last_error = str(exc)
                logger.exception("PDF processing failed: %s", exc)
                self._close_active_db()
                return None

    def get_active_db(self):
        with self._db_lock:
            if self.active_db is not None:
                try:
                    self.active_db._collection.count()
                    return self.active_db
                except Exception:
                    logger.warning("Active document DB is unavailable", exc_info=True)
                    self._close_active_db()

            if not os.path.isdir(self.db_dir):
                return None
            try:
                import chromadb
                client = chromadb.PersistentClient(path=self.db_dir)
                collections = client.list_collections()
                if not collections:
                    return None
                # There should be one collection because process_pdf recreates the directory.
                collection_name = collections[0].name
                self.active_db = Chroma(
                    persist_directory=self.db_dir,
                    embedding_function=self.embeddings,
                    collection_name=collection_name,
                )
                self.active_db._collection.count()
                return self.active_db
            except Exception as exc:
                self.last_error = str(exc)
                logger.exception("Could not reload document database")
                self._close_active_db()
                return None

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

    def ask_question(self, vector_db, query: str, history: Optional[List[dict]] = None):
        if vector_db is None:
            return "No document database is loaded. Please upload and analyze a PDF first."
        history = history or []
        try:
            try:
                vector_db._collection.count()
            except Exception:
                recovered = self.get_active_db()
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
            self.last_error = str(exc)
            return "Could not answer from the PDF. Please try again, and check the server logs if the problem continues."
