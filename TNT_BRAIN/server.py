from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from pydantic import BaseModel
import uvicorn
import os
from dotenv import load_dotenv

# Services folder se imports
from services.draft_service import research_and_draft, ask_legal_ai 
from services.research_service import ResearchService
from services.document_service import DocumentService
from langchain_openai import ChatOpenAI

load_dotenv()

app = FastAPI()

# 1. Folder Setup
if not os.path.exists("uploads"):
    os.makedirs("uploads")

# 2. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Services
research_ai = ResearchService() 
doc_service = DocumentService()

# --- Data Models ---
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

        docs = vector_db.similarity_search(request.query, k=5)
        pdf_context = "\n".join([f"Page {d.metadata.get('page')}: {d.page_content}" for d in docs])

        prompt = f"""
        You are a Legal AI Intelligence Assistant. 
        I have provided you the PDF TEXT below. You MUST answer the question using only this text.
        
        PDF TEXT:
        {pdf_context}
        
        USER QUESTION: {request.query}
        
        STRICT RULES:
        1. Never say you cannot see the file.
        2. Cite the exact Page Number for every fact.
        3. If not found in text, say 'Information not present in the document'.
        """
        
        answer = ask_legal_ai(prompt)
        return {"answer": answer}
    except Exception as e:
        print(f"Chat System Error: {e}")
        return {"answer": f"System Error: {str(e)}"}

# ==========================================
# 3. DRAFT GENERATION
# ==========================================
# ==========================================
# 3. DRAFT GENERATION (Updated for 6-Variable Output)
# ==========================================
@app.post("/api/generate-legal-draft")
async def generate_draft(
    facts: str = Form(...), 
    language: str = Form("English"), 
    documentType: str = Form("Bail Application"), 
    referenceFile: Optional[UploadFile] = File(None)
):
    try:
        # UPDATED: Now capturing all 6 return values from drafting_service
        draft, judgments, arguments, timeline, affidavit, strategy = research_and_draft(
            facts, documentType, language
        )
        
        return {
            "success": True, 
            "draft": draft, 
            "judgments": judgments, 
            "arguments": arguments, 
            "timeline": timeline,
            "affidavit": affidavit,  # Naya Variable (Feature 1)
            "strategy": strategy     # Naya Variable (Feature 2 & 4)
        }
        
    except Exception as e:
        # Error handling for variable mismatch or AI failure
        print(f"Drafting Error: {e}")
        return {
            "success": False, 
            "error": str(e),
            "message": "Variable mismatch? Check if research_and_draft returns 6 values."
        }
# ==========================================
# 4. AI COMMANDS (Expand / Legalize Logic)
# ==========================================
@app.post("/api/ai-command")
async def handle_ai_command(request: AICommandRequest):
    try:
        # Professional legal model configuration
        llm = ChatOpenAI(model_name="gpt-4o", temperature=0.3)
        
        system_prompt = (
            "You are a Senior Legal Draftsman. Based on the User Command, modify the SELECTED TEXT. "
            "Maintain the legal tone and ensure the output is professional. "
            "If the command is 'Expand', make the text much longer (at least 200 words) with deep legal reasoning. "
            "If the command is 'Legalize', replace simple words with complex legal terminology. "
            "Ensure the output uses **BOLD** for important legal sections and citations."
        )

        user_prompt = f"""
        CASE CONTEXT: {request.context}
        COMMAND: {request.command}
        SELECTED TEXT TO MODIFY: {request.text}
        
        Provide only the modified text as the response. No introduction, no 'Here is your text'.
        """

        response = llm.invoke([
            ("system", system_prompt),
            ("human", user_prompt)
        ])

        return {"success": True, "newText": response.content}
    
    except Exception as e:
        print(f"AI Command Error: {e}")
        return {"success": False, "error": str(e)}

# ==========================================
# 5. LEGAL RESEARCH & BILINGUAL SUPPORT
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
# EXECUTION
# ==========================================
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)


    # Ye code check karega ki legal_db folder mil raha hai ya nahi
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_PATH = os.path.join(BASE_DIR, "legal_db")