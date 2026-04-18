import os
import shutil
import base64
import fitz  # PyMuPDF
import time
import threading
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_core.messages import HumanMessage
from langchain_core.documents import Document

class DocumentService:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.db_dir = "temp_db"
        self.llm_vision = ChatOpenAI(model_name="gpt-4o-mini", temperature=0)
        
        # Memory variable
        self.active_db = None

    def _cleanup_task(self, folder_path, delay=3600):
        """Background thread to delete the temp database after a delay"""
        def run():
            time.sleep(delay)
            try:
                if os.path.exists(folder_path):
                    shutil.rmtree(folder_path)
                    print(f"🧹 Cleanup Success: Deleted {folder_path}")
            except Exception as e:
                print(f"⚠️ Cleanup Failed: {e}")
        
        threading.Thread(target=run, daemon=True).start()

    def _perform_vision_ocr(self, file_path):
        """Scanned PDF (Marathi/English) extraction using GPT-4o-mini Vision"""
        print(f"--- Starting High-Accuracy Vision OCR for: {file_path} ---")
        doc = fitz.open(file_path)
        ocr_docs = []

        # Scanned documents ke liye first 20 pages scan karein
        for page_num in range(min(len(doc), 20)):
            page = doc.load_page(page_num)
            
            # Zoom level 1:1 taaki tokens kam use hon
            pix = page.get_pixmap(matrix=fitz.Matrix(1, 1)) 
            img_bytes = pix.tobytes("png")
            base64_image = base64.b64encode(img_bytes).decode('utf-8')

            message = HumanMessage(
                content=[
                    {
                        "type": "text", 
                        "text": """Extract all text from this Indian Legal Document. 
                        The document may be in Marathi or English. 
                        Identify all dates (e.g. 14/02/2015), party names, and legal sections.
                        Translate Marathi facts into English while maintaining accuracy, 
                        but keep key terms like (Fariyadi, Panchnama, etc) in brackets."""
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/png;base64,{base64_image}"}
                    },
                ]
            )
            
            response = self.llm_vision.invoke([message])
            ocr_docs.append(Document(
                page_content=response.content,
                metadata={"page": page_num + 1, "source": "AI-Vision-OCR"}
            ))
            print(f"--- Page {page_num + 1} Processed ---")
            
            # Rate limit se bachane ke liye har page ke baad 2 second rukein
            time.sleep(2) 
            
        return ocr_docs

    def process_pdf(self, file_path):
        """Standard + Vision OCR Hybrid Processor"""
        # 1. Standard Extraction
        loader = PyMuPDFLoader(file_path)
        data = loader.load()
        all_text = "".join([doc.page_content for doc in data]).strip()
        
        # 2. Fallback to Vision OCR if scanned
        if not all_text:
            print("!!! Scanned Document Detected. Triggering Vision OCR !!!")
            data = self._perform_vision_ocr(file_path)
        
        if not data:
            return None

        # 3. Smart Chunking (Optimized for speed)
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,   
            chunk_overlap=200, 
            separators=["\n\n", "\n", ".", " "]
        )
        chunks = text_splitter.split_documents(data)
        
        # 4. Save to ChromaDB (Fixed collection name for multi-worker support)
        vector_db = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=self.db_dir,
            collection_name="current_legal_doc" # Fixed name, NO Timestamp
        )

        # Active DB set kiya aur cleanup trigger kiya
        self.active_db = vector_db 
        self._cleanup_task(self.db_dir, delay=3600)

        return vector_db

    def get_active_db(self):
        """Agar RAM mein DB nahi hai, toh Hard Drive se load karo (Multi-Worker Fix)"""
        # Agar current worker ki memory mein hai, toh direct bhej do
        if self.active_db is not None:
            return self.active_db
        
        # Agar doosre worker ne banaya tha, toh folder se utha lo
        if os.path.exists(self.db_dir):
            print("🔄 Loading DB from Disk for new Worker...")
            self.active_db = Chroma(
                persist_directory=self.db_dir, 
                embedding_function=self.embeddings,
                collection_name="current_legal_doc" # Wahi fixed name yahan use hoga
            )
            return self.active_db
            
        return None

    def get_timeline(self, vector_db):
        """Timeline extractor with Page References"""
        if vector_db is None:
            return "Analysis failed. Document unreadable."

        docs = vector_db.similarity_search(
            "Marriage date, filing date, incidents, court orders, chronology", 
            k=5 
        )
        
        context = "\n\n".join([f"[PAGE {d.metadata.get('page')}]: {d.page_content}" for d in docs])
        
        prompt = f"""
        Analyze the legal context and prepare a precise CHRONOLOGY.
        
        STRICT RULES:
        1. Every event MUST have a Reference Page Number.
        2. Keep legal terms like (Fariyadi, Panchnama, etc.) in brackets next to English terms.
        3. Format: [DD/MM/YYYY] - Event Description - (Ref: Page X)
        
        CONTEXT:
        {context}
        """
        return self.llm_vision.invoke(prompt).content

    def ask_question(self, vector_db, query, history=[]):
        """Multilingual Chat with Page Citations"""
        if vector_db is None: return "No document loaded."

        docs = vector_db.similarity_search(query, k=3)
        context = "\n\n".join([f"[PAGE {d.metadata.get('page')}]: {d.page_content}" for d in docs])

        prompt = f"""
        You are an expert Indian Legal Assistant. 
        
        TASK:
        1. Answer the question in the SAME LANGUAGE as the user's question. 
        2. Use the provided context to answer.
        3. Keep original legal terms in brackets.
        4. ALWAYS mention the Page Number as 'Page X'.
        
        CONTEXT:
        {context}
        
        USER QUESTION: {query}
        """

        response = self.llm_vision.invoke(prompt)
        return response.content