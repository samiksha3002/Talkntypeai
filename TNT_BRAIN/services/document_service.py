import os
import shutil
import base64
import fitz  # PyMuPDF
import time
import threading
import gc
import uuid
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.documents import Document


class DocumentService:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.db_dir = "temp_db"
        self._db_lock = threading.Lock()          # ✅ Thread safety
        self._cleanup_timer = None                # ✅ Track cleanup timer

        self.llm_vision = ChatOpenAI(
            model_name="gpt-4o-mini",
            temperature=0,
            max_tokens=2000
        )
        self.llm_answer = ChatOpenAI(
            model_name="gpt-4o",
            temperature=0.2,
            max_tokens=2000
        )
        self.llm_timeline = ChatOpenAI(
            model_name="gpt-4o",
            temperature=0,
            max_tokens=2000
        )

        self.active_db = None

    # ==========================================
    # SAFE DB CLEANUP
    # ==========================================
    def _safe_delete_db(self, folder_path):
        """Safely delete DB - acquire lock first"""
        with self._db_lock:
            try:
                # ✅ Release active_db reference before deleting
                if self.active_db is not None:
                    try:
                        self.active_db._client.close()
                    except Exception:
                        pass
                    self.active_db = None

                if os.path.exists(folder_path):
                    # ✅ Retry logic for Windows file locking
                    for attempt in range(5):
                        try:
                            shutil.rmtree(folder_path)
                            print(f"🧹 Cleanup: Deleted {folder_path}")
                            break
                        except PermissionError:
                            print(f"⚠️ Delete attempt {attempt+1} failed, retrying...")
                            time.sleep(2)
            except Exception as e:
                print(f"⚠️ Cleanup Failed: {e}")

    def _cleanup_task(self, folder_path, delay=7200):
        """Background cleanup with cancel support"""
        # Cancel previous timer if exists
        if self._cleanup_timer is not None:
            self._cleanup_timer.cancel()

        def run():
            time.sleep(delay)
            self._safe_delete_db(folder_path)

        t = threading.Thread(target=run, daemon=True)
        t.start()
        self._cleanup_timer = t

    # ==========================================
    # VISION OCR
    # ==========================================
    def _perform_vision_ocr(self, file_path):
        print(f"--- Vision OCR Starting: {file_path} ---")
        doc = fitz.open(file_path)
        ocr_docs = []

        for page_num in range(min(len(doc), 25)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
            img_bytes = pix.tobytes("png")
            base64_image = base64.b64encode(img_bytes).decode('utf-8')

            message = HumanMessage(
                content=[
                    {
                        "type": "text",
                        "text": """You are an expert Indian Legal Document OCR specialist.
Extract ALL text from this document page with 100% accuracy.

INSTRUCTIONS:
1. Document may be in Marathi, Hindi, or English - extract as-is in original language
2. Also provide English translation below each paragraph in [TRANSLATION: ...]
3. Identify and highlight: Dates, Party Names, Case Numbers, Legal Sections, FIR Numbers
4. Keep Marathi/Hindi legal terms in original with English meaning: e.g., फिर्यादी (Complainant)
5. Format dates consistently: DD/MM/YYYY
6. If text is unclear, mark as [UNCLEAR]
7. Preserve all numbers, amounts, and figures exactly

Extract every word visible on this page:"""
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{base64_image}",
                            "detail": "high"
                        }
                    },
                ]
            )

            try:
                response = self.llm_vision.invoke([message])
                ocr_docs.append(Document(
                    page_content=response.content,
                    metadata={
                        "page": page_num + 1,
                        "source": "Vision-OCR",
                        "file": os.path.basename(file_path)
                    }
                ))
                print(f"✅ Page {page_num + 1}/{min(len(doc), 25)} done")
            except Exception as e:
                print(f"⚠️ Page {page_num + 1} OCR failed: {e}")
                ocr_docs.append(Document(
                    page_content=f"[Page {page_num+1} extraction failed]",
                    metadata={"page": page_num + 1, "source": "OCR-Failed"}
                ))

            time.sleep(1.5)

        doc.close()
        gc.collect()
        return ocr_docs

    # ==========================================
    # PROCESS PDF - FIXED
    # ==========================================
    def process_pdf(self, file_path):
        with self._db_lock:  # ✅ Lock during entire DB creation
            try:
                loader = PyMuPDFLoader(file_path)
                data = loader.load()

                for doc in data:
                    doc.page_content = doc.page_content.encode('utf-8', errors='replace').decode('utf-8')

                all_text = "".join([doc.page_content for doc in data]).strip()

                if len(all_text) < 100:
                    print("Scanned PDF - Vision OCR starting...")
                    data = self._perform_vision_ocr(file_path)
                    for doc in data:
                        doc.page_content = doc.page_content.encode('utf-8', errors='replace').decode('utf-8')

                if not data:
                    return None

                text_splitter = RecursiveCharacterTextSplitter(
                    chunk_size=1500,
                    chunk_overlap=300,
                    separators=["\n\n", "\n", "।", ".", " "]
                )
                chunks = text_splitter.split_documents(data)

                # ✅ FIX 1: Close existing DB before deleting directory
                if self.active_db is not None:
                    try:
                        self.active_db._client.close()
                    except Exception:
                        pass
                    self.active_db = None
                    gc.collect()
                    time.sleep(0.5)  # ✅ Wait for file handles to release

                # ✅ FIX 2: Use unique collection name to avoid stale data
                collection_name = f"legal_doc_{uuid.uuid4().hex[:8]}"

                # ✅ FIX 3: Fresh directory every time
                if os.path.exists(self.db_dir):
                    for attempt in range(5):
                        try:
                            shutil.rmtree(self.db_dir)
                            break
                        except PermissionError:
                            print(f"⚠️ rmtree attempt {attempt+1}, waiting...")
                            time.sleep(1)

                os.makedirs(self.db_dir, exist_ok=True)

                # ✅ FIX 4: Create Chroma with explicit settings
                vector_db = Chroma.from_documents(
                    documents=chunks,
                    embedding=self.embeddings,
                    persist_directory=self.db_dir,
                    collection_name=collection_name,
                    collection_metadata={"hnsw:space": "cosine"}
                )

                self.active_db = vector_db
                self._cleanup_task(self.db_dir, delay=7200)
                gc.collect()
                return vector_db

            except Exception as e:
                print(f"❌ PDF Processing Error: {e}")
                import traceback
                traceback.print_exc()
                return None

    # ==========================================
    # GET ACTIVE DB - FIXED
    # ==========================================
    def get_active_db(self):
        with self._db_lock:
            # ✅ Test if existing DB is still alive
            if self.active_db is not None:
                try:
                    self.active_db._collection.count()  # Ping test
                    return self.active_db
                except Exception as e:
                    print(f"⚠️ Active DB dead, reloading from disk: {e}")
                    self.active_db = None

            # ✅ Reload from disk if directory exists
            if os.path.exists(self.db_dir):
                try:
                    print("🔄 Loading DB from Disk...")
                    # ✅ Find the correct collection name from disk
                    import chromadb
                    client = chromadb.PersistentClient(path=self.db_dir)
                    collections = client.list_collections()

                    if not collections:
                        print("❌ No collections found in DB directory")
                        return None

                    # Use the most recent collection
                    collection_name = collections[0].name
                    client_settings = chromadb.Settings(
                        anonymized_telemetry=False,
                        allow_reset=True
                    )

                    self.active_db = Chroma(
                        persist_directory=self.db_dir,
                        embedding_function=self.embeddings,
                        collection_name=collection_name,
                    )
                    return self.active_db
                except Exception as e:
                    print(f"❌ Disk reload failed: {e}")
                    return None

            return None

    # ==========================================
    # TIMELINE GENERATOR
    # ==========================================
    def get_timeline(self, vector_db):
        if vector_db is None:
            return "Analysis failed. Document could not be read."

        try:
            search_queries = [
                "dates incidents events chronology timeline",
                "marriage date FIR complaint filing court order",
                "first incident second incident assault attack",
                "registration date agreement property transaction",
            ]

            all_docs = []
            seen = set()
            for q in search_queries:
                # ✅ Wrap in try/except per query
                try:
                    docs = vector_db.similarity_search(q, k=4)
                    for d in docs:
                        key = d.page_content[:100]
                        if key not in seen:
                            seen.add(key)
                            all_docs.append(d)
                except Exception as e:
                    print(f"⚠️ Timeline search failed for '{q}': {e}")
                    continue

            if not all_docs:
                return "Could not retrieve document content for timeline generation."

            context = "\n\n".join([
                f"[PAGE {d.metadata.get('page', '?')}]:\n{d.page_content}"
                for d in all_docs
            ])

            system_msg = SystemMessage(content="""You are an expert Indian Legal Case Analyst.
Your task is to create a PRECISE, DETAILED chronological timeline from legal documents.
You work with documents in Marathi, Hindi, and English.""")

            human_msg = HumanMessage(content=f"""Create a detailed CHRONOLOGICAL TIMELINE from this legal document.

STRICT RULES:
1. Every event MUST have exact date if available, else approximate period
2. Format each entry as: 📅 [DD/MM/YYYY] — Event Description — (Ref: Page X)
3. Keep Marathi/Hindi legal terms with English meaning: फिर्यादी (Complainant)
4. Group by: Pre-Incident → Incident → Post-Incident → Legal Proceedings
5. Include: All dates, names of parties, locations, amounts, case numbers
6. If date is unclear, write: [Date Unknown - approximately YYYY]
7. Minimum 10-15 timeline entries if available in document
8. End with: "KEY PARTIES IDENTIFIED:" section listing all names

DOCUMENT CONTEXT:
{context}

Generate the complete timeline now:""")

            response = self.llm_timeline.invoke([system_msg, human_msg])
            return response.content

        except Exception as e:
            print(f"❌ Timeline Error: {e}")
            return f"Timeline generation failed: {str(e)}"

    # ==========================================
    # ASK QUESTION
    # ==========================================
    def ask_question(self, vector_db, query, history=[]):
        if vector_db is None:
            return "❌ No document loaded. Please upload and analyze a PDF first."

        try:
            # ✅ Validate DB is alive before querying
            try:
                vector_db._collection.count()
            except Exception as e:
                print(f"⚠️ DB health check failed: {e}")
                # Try to recover from disk
                recovered = self.get_active_db()
                if recovered is None:
                    return "❌ Document database is unavailable. Please re-upload the PDF."
                vector_db = recovered

            docs = vector_db.similarity_search(query, k=6)

            if not docs:
                return "The document does not contain information related to your question."

            context = "\n\n".join([
                f"[PAGE {d.metadata.get('page', '?')}]:\n{d.page_content}"
                for d in docs
            ])

            history_text = ""
            if history:
                recent_history = history[-4:]
                history_text = "\n".join([
                    f"{'Advocate' if h.get('role') == 'user' else 'Assistant'}: {h.get('content', '')}"
                    for h in recent_history
                ])

            system_msg = SystemMessage(content="""You are an expert Indian Legal Document Assistant with deep knowledge of:
- Indian Penal Code (IPC), CrPC, CPC, Evidence Act
- Marathi, Hindi, and English legal documents
- Family law, Criminal law, Civil law, Property law

YOUR CORE RULES:
1. ACCURACY FIRST: Answer ONLY from the provided document context. Never hallucinate.
2. LANGUAGE MATCHING: Detect the language of the question and reply in THE SAME LANGUAGE.
   - English question → English answer
   - Hindi question → Hindi answer
   - Marathi question → Marathi answer
   - Mixed language → Match the primary language used
3. CITATIONS: Always cite page numbers at end of statements: (Ref: Page X)
4. LEGAL TERMS: Preserve original Marathi/Hindi terms with English translation in brackets
5. MISSING INFO: If info not in document, clearly say: "This information is not mentioned in the uploaded document."
6. SUMMARIES: For summary requests, give comprehensive structured summary from all available context
7. BE THOROUGH: Give complete, detailed answers. Do not truncate important information.""")

            human_msg = HumanMessage(content=f"""DOCUMENT EXCERPTS (Source of Truth):
{context}

CONVERSATION HISTORY:
{history_text if history_text else "No previous conversation"}

ADVOCATE'S QUESTION: {query}

Instructions:
- Answer in the SAME LANGUAGE as the question above
- Base answer ONLY on document excerpts provided
- Cite page numbers for every fact stated
- If asking about a person/date/amount - give exact details from document
- For legal analysis questions - apply Indian law to the facts found

Provide your detailed answer:""")

            response = self.llm_answer.invoke([system_msg, human_msg])
            return response.content

        except Exception as e:
            print(f"❌ Chat Error: {e}")
            return f"Error processing your question: {str(e)}"