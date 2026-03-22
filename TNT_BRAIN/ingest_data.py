import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

# .env se key load karega
load_dotenv()

DATA_PATH = "Legal_PDFs"
CHROMA_PATH = "legal_db"

def main():
    if not os.path.exists(DATA_PATH):
        print(f"Error: '{DATA_PATH}' folder nahi mila!")
        return

    documents = []
    print("PDFs read ho rahi hain (OpenAI Version)...")
    for file in os.listdir(DATA_PATH):
        if file.endswith(".pdf"):
            print(f"Loading: {file}...")
            loader = PyPDFLoader(os.path.join(DATA_PATH, file))
            documents.extend(loader.load())
    
    # 1. Text ko Chunks mein todna
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_documents(documents)
    print(f"Total {len(chunks)} chunks ban gaye hain.")

    # 2. OpenAI Embeddings (Sabse stable: text-embedding-3-small)
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

    # 3. Database taiyar karna
    print("Database taiyar ho raha hai... Please wait.")
    try:
        # Purana database clean karne ke liye fresh shuru karein
        vector_db = Chroma.from_documents(
            documents=chunks, 
            embedding=embeddings, 
            persist_directory=CHROMA_PATH
        )
        print(f"SUCCESS! Saara data '{CHROMA_PATH}' folder mein save ho gaya hai.")
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    main()