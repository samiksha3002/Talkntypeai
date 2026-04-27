import os
import shutil
import base64
import fitz  # PyMuPDF
import time
import threading
import gc
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.documents import Document

class DocumentService:
    def __init__(self):
        # ✅ GLOBAL - ek baar banao, baar baar nahi
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.db_dir = "temp_db"

        # ✅ Vision OCR ke liye - gpt-4o-mini (cost effective)
        self.llm_vision = ChatOpenAI(
            model_name="gpt-4o-mini",
            temperature=0,
            max_tokens=2000
        )

        # ✅ Answering ke liye - gpt-4o (accurate & multilingual)
        self.llm_answer = ChatOpenAI(
            model_name="gpt-4o",
            temperature=0.2,
            max_tokens=2000
        )

        # ✅ Timeline ke liye - gpt-4o
        self.llm_timeline = ChatOpenAI(
            model_name="gpt-4o",
            temperature=0,
            max_tokens=2000
        )

        self.active_db = None

    # ==========================================
    # BACKGROUND CLEANUP
    # ==========================================
    def _cleanup_task(self, folder_path, delay=3600):
        def run():
            time.sleep(delay)
            try:
                if os.path.exists(folder_path):
                    shutil.rmtree(folder_path)
                    print(f"🧹 Cleanup: Deleted {folder_path}")
            except Exception as e:
                print(f"⚠️ Cleanup Failed: {e}")
        threading.Thread(target=run, daemon=True).start()

    # ==========================================
    # VISION OCR - SCANNED PDF (Marathi/Hindi/English)
    # ==========================================
    def _perform_vision_ocr(self, file_path):
        """Scanned PDF - GPT-4o-mini Vision se text extract karo"""
        print(f"--- Vision OCR Starting: {file_path} ---")
        doc = fitz.open(file_path)
        ocr_docs = []

        for page_num in range(min(len(doc), 25)):  # Max 25 pages
            page = doc.load_page(page_num)
            pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))  # ✅ 1.5x zoom for clarity
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
                            "detail": "high"  # ✅ High detail for accuracy
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

            time.sleep(1.5)  # Rate limit protection

        doc.close()
        gc.collect()
        return ocr_docs

    # ==========================================
    # PROCESS PDF - MAIN FUNCTION
    # ==========================================
    def process_pdf(self, file_path):
        """PDF ko read karo, chunks banao, ChromaDB mein save karo"""
        try:
            # STEP 1: Standard text extraction
            loader = PyMuPDFLoader(file_path)
            data = loader.load()
            all_text = "".join([doc.page_content for doc in data]).strip()

            # STEP 2: Agar text nahi mila = scanned PDF, Vision OCR use karo
            if len(all_text) < 100:
                print("⚠️ Scanned PDF detected - Starting Vision OCR...")
                data = self._perform_vision_ocr(file_path)

            if not data:
                return None

            # STEP 3: Smart chunking
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1500,    # ✅ Larger chunks = more context per answer
                chunk_overlap=300,  # ✅ More overlap = no info lost at boundaries
                separators=["\n\n", "\n", "।", ".", " "]  # ✅ Marathi full stop "।" added
            )
            chunks = text_splitter.split_documents(data)
            print(f"✅ Total chunks created: {len(chunks)}")

            # STEP 4: Old DB clear karo, naya banao
            if os.path.exists(self.db_dir):
                shutil.rmtree(self.db_dir)
                print("🗑️ Old DB cleared")

            # STEP 5: ChromaDB mein save karo
            vector_db = Chroma.from_documents(
                documents=chunks,
                embedding=self.embeddings,
                persist_directory=self.db_dir,
                collection_name="current_legal_doc"
            )

            self.active_db = vector_db
            self._cleanup_task(self.db_dir, delay=7200)  # 2 hours baad delete

            gc.collect()
            print(f"✅ PDF processed successfully: {len(chunks)} chunks saved")
            return vector_db

        except Exception as e:
            print(f"❌ PDF Processing Error: {e}")
            return None

    # ==========================================
    # GET ACTIVE DB
    # ==========================================
    def get_active_db(self):
        """RAM mein nahi hai toh disk se load karo"""
        if self.active_db is not None:
            return self.active_db

        if os.path.exists(self.db_dir):
            print("🔄 Loading DB from Disk...")
            self.active_db = Chroma(
                persist_directory=self.db_dir,
                embedding_function=self.embeddings,
                collection_name="current_legal_doc"
            )
            return self.active_db

        return None

    # ==========================================
    # TIMELINE GENERATOR - IMPROVED
    # ==========================================
    def get_timeline(self, vector_db):
        """Chronological timeline extract karo PDF se"""
        if vector_db is None:
            return "Analysis failed. Document could not be read."

        try:
            # Multiple searches for comprehensive timeline
            search_queries = [
                "dates incidents events chronology timeline",
                "marriage date FIR complaint filing court order",
                "first incident second incident assault attack",
                "registration date agreement property transaction",
            ]

            all_docs = []
            seen = set()
            for q in search_queries:
                docs = vector_db.similarity_search(q, k=4)
                for d in docs:
                    key = d.page_content[:100]
                    if key not in seen:
                        seen.add(key)
                        all_docs.append(d)

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
    # ASK QUESTION - MULTILINGUAL ACCURATE CHAT
    # ==========================================
    def ask_question(self, vector_db, query, history=[]):
        """Kisi bhi language mein question ka accurate answer do"""
        if vector_db is None:
            return "❌ No document loaded. Please upload and analyze a PDF first."

        try:
            # ✅ More chunks fetch karo for better accuracy
            docs = vector_db.similarity_search(query, k=6)

            if not docs:
                return "The document does not contain information related to your question."

            context = "\n\n".join([
                f"[PAGE {d.metadata.get('page', '?')}]:\n{d.page_content}"
                for d in docs
            ])

            # ✅ History format karo
            history_text = ""
            if history:
                recent_history = history[-4:]  # Last 4 exchanges only (memory efficient)
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