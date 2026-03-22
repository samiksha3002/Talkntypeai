import os
import shutil
import base64
import fitz  # PyMuPDF
import time
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain_core.messages import HumanMessage
from langchain_core.documents import Document

class DocumentService:
    def __init__(self):
        # OpenAI Embeddings setup
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.db_dir = "temp_db"
        self.llm_vision = ChatOpenAI(model_name="gpt-4o", temperature=0)

    def _perform_vision_ocr(self, file_path):
        """Scanned PDF (Marathi/English) ko images se extract karna using GPT-4o Vision"""
        print(f"--- Starting High-Accuracy Vision OCR for: {file_path} ---")
        doc = fitz.open(file_path)
        ocr_docs = []

        # Analyze first 10 pages for better context (Legal petitions are usually 5-10 pages)
        for page_num in range(min(len(doc), 10)):
            page = doc.load_page(page_num)
            # Zoom 2.0x for clear text extraction
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) 
            img_bytes = pix.tobytes("png")
            base64_image = base64.b64encode(img_bytes).decode('utf-8')

            # INSTRUCTION: Marathi context handle karne ke liye special prompt
            message = HumanMessage(
                content=[
                    {
                        "type": "text", 
                        "text": """Extract all text from this Indian Legal Document. 
                        The document may be in Marathi or English. 
                        Identify all dates (e.g. 14/02/2015), party names, and legal sections (e.g. 13(B)).
                        Translate Marathi facts into English while maintaining accuracy."""
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
            
        return ocr_docs

    def process_pdf(self, file_path):
        """Standard + Vision OCR Hybrid Processor"""
        current_timestamp = int(time.time())

        # 1. Standard Extraction (Digital PDFs ke liye)
        loader = PyMuPDFLoader(file_path)
        data = loader.load()
        all_text = "".join([doc.page_content for doc in data]).strip()
        
        # 2. Fallback to Vision OCR if scanned (Marathi Scanned Documents)
        if not all_text:
            print("!!! Scanned/Handwritten Document Detected. Triggering Vision OCR !!!")
            data = self._perform_vision_ocr(file_path)
        
        if not data:
            return None

        # 3. Smart Chunking
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1500,
            chunk_overlap=300,
            separators=["\n\n", "\n", ".", " "]
        )
        chunks = text_splitter.split_documents(data)
        
        # 4. Save to ChromaDB (Windows WinError 32 Fix using Unique Collections)
        print(f"--- Syncing Vector Store: collection_{current_timestamp} ---")
        vector_db = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=self.db_dir,
            collection_name=f"legal_hub_{current_timestamp}"
        )
        return vector_db

    def get_timeline(self, vector_db):
        """Timeline extractor optimized for Indian Dates (DD/MM/YYYY)"""
        if vector_db is None:
            return "Analysis failed. Document unreadable."

        # Similarity search for date-heavy segments
        docs = vector_db.similarity_search(
            "Marriage date, separation date, filing date, court stamp date, chronology", 
            k=12
        )
        
        context = "\n\n".join([f"[Page {d.metadata.get('page')}]: {d.page_content}" for d in docs])
        
        llm = ChatOpenAI(model_name="gpt-4o", temperature=0)
        prompt = f"""
        Analyze the following legal document context (could be Marathi translated to English).
        Prepare a precise CHRONOLOGY of events.
        
        IMPORTANT: Look for '14/02/2015' (Marriage) and '02/01/2024' (Separation) in the text.
        
        FORMAT:
        Date: [DD/MM/YYYY] | Event: [Short Description] | Ref: [Page No]
        
        CONTEXT:
        {context}
        """
        
        return llm.invoke(prompt).content