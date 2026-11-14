"""Request-local retrieval: no persistent Chroma, shared cache, or recovery path."""
import fitz
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_core.documents import Document
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from services.document_service import DocumentService

class RequestDocuments(DocumentService):
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(model='text-embedding-3-small',request_timeout=45,max_retries=0)
        self.llm_vision = ChatOpenAI(model='gpt-4o-mini',temperature=0,max_tokens=3000,timeout=45,max_retries=0)
        self.llm_answer = ChatOpenAI(model='gpt-4o',temperature=0.2,max_tokens=2500,timeout=45,max_retries=0)
        self.llm_timeline = ChatOpenAI(model='gpt-4o',temperature=0,max_tokens=3000,timeout=45,max_retries=0)
        self.last_error = None

    def get_active_db(self):
        # The inherited answer helper must never recover another request's DB.
        return None

    def process_pdf(self, path):
        with fitz.open(path) as pdf:
            pages = [Document(page_content=p.get_text(),metadata={'page':i+1}) for i,p in enumerate(pdf)]
        if sum(len(p.page_content.strip()) for p in pages) < 100:
            # Reject instead of silently OCRing only the first 25 pages.
            if len(pages) > 25:
                raise ValueError('Scanned PDF exceeds the 25-page OCR limit.')
            pages = self._perform_vision_ocr(path)
            if any(p.metadata.get('source') == 'OCR-Failed' for p in pages):
                raise ValueError('OCR failed.')
        if sum(len(p.page_content) for p in pages) > 200000:
            raise ValueError('PDF text limit exceeded.')
        chunks = RecursiveCharacterTextSplitter(chunk_size=1500,chunk_overlap=250).split_documents(pages)
        if not chunks or len(chunks) > 200:
            raise ValueError('PDF chunk limit exceeded or no readable text.')
        store = InMemoryVectorStore.from_documents(chunks,self.embeddings)
        # Compatibility with the existing stateless timeline/answer helpers.
        class Collection:
            def count(self): return len(chunks)
        class Index:
            _collection = Collection()
            def similarity_search(self, query, k=7):
                return store.similarity_search(query,k=k)
        return Index()
