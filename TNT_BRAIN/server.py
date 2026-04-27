from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse  # ✅ ADD THIS
from typing import Optional, List
from pydantic import BaseModel
import uvicorn
import os
import gc
from dotenv import load_dotenv

from services.draft_service import research_and_draft, research_and_draft_stream, ask_legal_ai
from services.research_service import ResearchService
from services.document_service import DocumentService
from langchain_openai import ChatOpenAI

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

research_ai = ResearchService()
doc_service = DocumentService()
llm = ChatOpenAI(model_name="gpt-4o", temperature=0.3, max_tokens=1000)

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
# ✅ NEW STREAMING ENDPOINT
# ==========================================
@app.post("/api/generate-legal-draft-stream")
async def generate_draft_stream(request: DraftRequest):
    """
    Ye endpoint streaming karta hai - frontend ko word by word milega.
    Content-Type: text/event-stream
    """
    def token_generator():
        try:
            for token in research_and_draft_stream(
                request.facts,
                request.documentType,
                request.language
            ):
                # SSE format: "data: <content>\n\n"
                # Special chars escape karo
                safe_token = token.replace("\n", "\\n")
                yield f"data: {safe_token}\n\n"
        except Exception as e:
            yield f"data: [ERROR]: {str(e)}\n\n"
        finally:
            yield "data: [DONE]\n\n"  # Frontend ko signal do ki stream khatam

    return StreamingResponse(
        token_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # ✅ Nginx buffering disable
            "Connection": "keep-alive",
        }
    )


# ==========================================
# OLD ENDPOINTS (unchanged)
# ==========================================
@app.post("/api/analyze-document")
async def analyze_doc(file: UploadFile = File(...)):
    try:
        file_path = os.path.join("uploads", file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        vector_db = doc_service.process_pdf(file_path)
        timeline = doc_service.get_timeline(vector_db)
        os.remove(file_path)
        gc.collect()
        return {"success": True, "timeline": timeline}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/api/chat-with-pdf")
async def chat_with_pdf(request: ChatRequest):
    try:
        vector_db = doc_service.get_active_db()
        if vector_db is None:
            return {"answer": "Error: Please upload and analyze PDF again."}
        answer = doc_service.ask_question(vector_db, request.query, request.history)
        return {"answer": answer}
    except Exception as e:
        return {"answer": f"System Error: {str(e)}"}


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
                pdf_context = doc_service.ask_question(vector_db, "Summarize all legal facts and parties.", [])
                final_facts = f"CONTEXT FROM PDF:\n{pdf_context}\n\nUSER INSTRUCTIONS:\n{final_facts}"
            os.remove(file_path)
            gc.collect()

        if not final_facts.strip():
            return ["Please provide case facts or upload a PDF.", "N/A", "N/A", "N/A", "N/A", "N/A"]

        draft, judgments, arguments, timeline, affidavit, strategy = research_and_draft(final_facts, documentType, language)
        return [draft, judgments, arguments, timeline, affidavit, strategy]
    except Exception as e:
        return [f"Error: {str(e)}", "N/A", "N/A", "N/A", "N/A", "N/A"]


@app.post("/api/ai-command")
async def handle_ai_command(request: AICommandRequest):
    try:
        system_prompt = "You are a Senior Legal Draftsman. Modify SELECTED TEXT based on command. Maintain legal tone."
        user_prompt = f"CONTEXT: {request.context}\nCOMMAND: {request.command}\nTEXT: {request.text}"
        response = llm.invoke([("system", system_prompt), ("human", user_prompt)])
        return {"success": True, "newText": response.content}
    except Exception as e:
        return {"success": False, "error": str(e)}


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
    uvicorn.run(app, host="0.0.0.0", port=port)