from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from pydantic import BaseModel
import uvicorn
import os
import shutil
import threading
import time
from dotenv import load_dotenv

# Services folder se imports
from services.draft_service import research_and_draft, ask_legal_ai 
from services.research_service import ResearchService
from services.document_service import DocumentService
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

load_dotenv()

app = FastAPI()

# ==========================================
# 1. FOLDER SETUP
# ==========================================
if not os.path.exists("uploads"):
    os.makedirs("uploads")

# ==========================================
# 2. CORS MIDDLEWARE (FIXED FOR SECURITY)
# ==========================================
app.add_middleware(
    CORSMiddleware,
    # "*" hata kar apne frontend ke exact URLs daalein
    allow_origins=[
        "https://talkntype.pro",     # Aapki live website
        "http://localhost:3000",     # Local React server
        "http://localhost:5173",     # Local Vite server (agar aap Vite use karte hain)
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Services
research_ai = ResearchService() 
doc_service = DocumentService()

# --- Data Models ---
class DraftRequest(BaseModel):
    facts: str
    language: Optional[str] = "English"
    documentType: Optional[str] = None

class ChatRequest(BaseModel):
    query: str
    context: str
    history: List[dict]

class ResearchRequest(BaseModel):
    query: str

class MarathiRequest(BaseModel):
    english_text: str

class AICommandRequest(BaseModel):
    command: str
    text: str
    context: str

# ==========================================
# 1. ANALYZE DOCUMENT (Timeline Extraction)
# ==========================================
@app.post("/api/analyze-document")
async def analyze_doc(file: UploadFile = File(...)):
    try:
        file_path = os.path.join("uploads", file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        vector_db = doc_service.process_pdf(file_path)
        timeline = doc_service.get_timeline(vector_db)
        return {"success": True, "timeline": timeline}
    except Exception as e:
        print(f"Analysis Error: {e}")
        return {"success": False, "error": str(e)}

# ==========================================
# 2. CHAT WITH PDF (RAG Logic)
# ==========================================
@app.post("/api/chat-with-pdf")
async def chat_with_pdf(request: ChatRequest):
    try:
        files = [f for f in os.listdir("uploads") if f.endswith('.pdf')]
        if not files:
            return {"answer": "No document found. Please upload a PDF first."}
        
        latest_file = os.path.join("uploads", files[-1])
        vector_db = doc_service.process_pdf(latest_file)
        
        if vector_db is None:
            return {"answer": "I'm sorry, this PDF is a scanned image and I cannot read its text yet."}

        # Optimized search and multi-language response
        answer = doc_service.ask_question(vector_db, request.query, request.history)
        return {"answer": answer}
        
    except Exception as e:
        print(f"Chat System Error: {e}")
        return {"answer": f"System Error: {str(e)}"}

# ==========================================
# 3. DRAFT GENERATION
# ==========================================
# ==========================================
# 3. DRAFT GENERATION (Supports Text & PDF)
# ==========================================
@app.post("/api/generate-legal-draft")
async def generate_draft(
    facts: Optional[str] = Form(None),           # Typing wale facts
    language: Optional[str] = Form("English"),    # Selected language
    documentType: Optional[str] = Form(None),     # Optional doc type
    file: Optional[UploadFile] = File(None)       # PDF File (Optional)
):
    try:
        final_facts = facts or ""

        # CASE: Agar PDF upload kiya gaya hai
        if file:
            # 1. File ko save karein
            file_path = os.path.join("uploads", file.filename)
            with open(file_path, "wb") as f:
                f.write(await file.read())
            
            # 2. PDF se text extract karein (aapka doc_service use karke)
            # Hum process_pdf use kar sakte hain ya koi direct extract text function
            # Yahan hum vector_db se summary nikal sakte hain ya text read kar sakte hain
            vector_db = doc_service.process_pdf(file_path)
            
            if vector_db:
                # PDF ka text nikal kar facts ke saath merge karna
                pdf_context = doc_service.ask_question(vector_db, "Summarize all legal facts and parties from this document in detail.", [])
                final_facts = f"CONTEXT FROM PDF:\n{pdf_context}\n\nUSER INSTRUCTIONS:\n{final_facts}"
            
            # Optional: Remove file after processing to save space
            # os.remove(file_path)

        # Validation: Agar kuch bhi nahi mila
        if not final_facts.strip():
            return ["Please provide case facts or upload a PDF document.", "N/A", "N/A", "N/A", "N/A", "N/A"]

        # 3. Research and Draft Service call karein
        # (Aapka existing service logic)
        draft, judgments, arguments, timeline, affidavit, strategy = research_and_draft(
            final_facts, documentType, language
        )
        
        return [draft, judgments, arguments, timeline, affidavit, strategy]

    except Exception as e:
        print(f"Error in Draft Generation: {e}")
        return [f"Drafting Error: {str(e)}", "N/A", "N/A", "N/A", "N/A", "N/A"]
    
    

# ==========================================
# 4. AI COMMANDS
# ==========================================
@app.post("/api/ai-command")
async def handle_ai_command(request: AICommandRequest):
    try:
        llm = ChatOpenAI(model_name="gpt-4o", temperature=0.3)
        system_prompt = (
            "You are a Senior Legal Draftsman. Based on the User Command, modify the SELECTED TEXT. "
            "Maintain the legal tone. Use **BOLD** for citations."
        )
        user_prompt = f"CONTEXT: {request.context}\nCOMMAND: {request.command}\nTEXT: {request.text}"
        
        response = llm.invoke([("system", system_prompt), ("human", user_prompt)])
        return {"success": True, "newText": response.content}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ==========================================
# 5. RESEARCH & TRANSLATION
# ==========================================
@app.post("/api/legal-research")
async def legal_research(request: ResearchRequest):
    try:
        return research_ai.perform_research(request.query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/translate-research-marathi")
async def translate_research(request: MarathiRequest):
    try:
        marathi_summary = research_ai.get_marathi_summary(request.english_text)
        return {"success": True, "marathi_summary": marathi_summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    

# ==========================================
# EXECUTION & PATHING
# ==========================================
if __name__ == "__main__":
    # LOCAL ke liye 8000 use karein (React connection fix), RENDER hamesha PORT env se leta hai
    port = int(os.environ.get("PORT", 8000)) 
    print(f"🚀 Server starting on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)