from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from pydantic import BaseModel
import uvicorn
import os
import gc  # ✅ ADD THIS
from dotenv import load_dotenv

from services.draft_service import research_and_draft, ask_legal_ai 
from services.research_service import ResearchService
from services.document_service import DocumentService
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

load_dotenv()

app = FastAPI()

if not os.path.exists("uploads"):
    os.makedirs("uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://talkntype.pro",
        "http://localhost:3000",
        "http://localhost:5173",
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ SINGLETON - sirf ek baar load hoga
research_ai = ResearchService() 
doc_service = DocumentService()
# ✅ LLM bhi ek baar globally banao
llm = ChatOpenAI(model_name="gpt-4o", temperature=0.3)

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
# 1. ANALYZE DOCUMENT
# ==========================================
@app.post("/api/analyze-document")
async def analyze_doc(file: UploadFile = File(...)):
    try:
        file_path = os.path.join("uploads", file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        
        vector_db = doc_service.process_pdf(file_path)
        timeline = doc_service.get_timeline(vector_db)
        
        # ✅ File process hone ke baad delete karo - disk/memory bachao
        os.remove(file_path)
        gc.collect()  # ✅ Memory free karo turant
        
        return {"success": True, "timeline": timeline}
    except Exception as e:
        print(f"Analysis Error: {e}")
        return {"success": False, "error": str(e)}

# ==========================================
# 2. CHAT WITH PDF
# ==========================================
@app.post("/api/chat-with-pdf")
async def chat_with_pdf(request: ChatRequest):
    try:
        vector_db = doc_service.get_active_db()
        
        if vector_db is None:
            return {"answer": "Error: Document is not loaded. Please upload and analyze the PDF again."}

        answer = doc_service.ask_question(vector_db, request.query, request.history)
        return {"answer": answer}
        
    except Exception as e:
        print(f"Chat System Error: {e}")
        return {"answer": f"System Error: {str(e)}"}

# ==========================================
# 3. DRAFT GENERATION
# ==========================================
@app.post("/api/generate-legal-draft")
async def generate_draft(
    facts: Optional[str] = Form(None),
    language: Optional[str] = Form("English"),
    documentType: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    try:
        final_facts = facts or ""

        if file:
            file_path = os.path.join("uploads", file.filename)
            with open(file_path, "wb") as f:
                f.write(await file.read())
            
            vector_db = doc_service.process_pdf(file_path)
            
            if vector_db:
                pdf_context = doc_service.ask_question(
                    vector_db, 
                    "Summarize all legal facts and parties from this document in detail.", 
                    []
                )
                final_facts = f"CONTEXT FROM PDF:\n{pdf_context}\n\nUSER INSTRUCTIONS:\n{final_facts}"
            
            # ✅ File turant delete karo
            os.remove(file_path)
            gc.collect()  # ✅ Memory free karo

        if not final_facts.strip():
            return ["Please provide case facts or upload a PDF document.", "N/A", "N/A", "N/A", "N/A", "N/A"]

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
        # ✅ Global llm use karo - naya object mat banao
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

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000)) 
    print(f"🚀 Server starting on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)