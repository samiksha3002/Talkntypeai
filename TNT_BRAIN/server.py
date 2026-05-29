from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Optional, List
from pydantic import BaseModel
import uvicorn
import os
import gc
import hashlib
import json
from dotenv import load_dotenv

from services.draft_service import research_and_draft, research_and_draft_stream, ask_legal_ai
from services.research_service import ResearchService
from services.document_service import DocumentService
from langchain_openai import ChatOpenAI

load_dotenv()

app = FastAPI()

if not os.path.exists("uploads"):
    os.makedirs("uploads")

# ==========================================
# Simple file-based user store
# (Replace with your DB logic if you have one)
# ==========================================
USERS_FILE = "users.json"

def load_users():
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# ==========================================
# CORS — must be before all routes
# ==========================================
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


# ==========================================
# Pydantic models
# ==========================================
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

# ✅ NEW: Auth models
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = ""


# ==========================================
# ✅ NEW: LOGIN ENDPOINT
# ==========================================
@app.post("/api/login")
async def login(request: LoginRequest):
    """
    User login - email/password verify karo aur token return karo.
    """
    try:
        users = load_users()
        email = request.email.lower().strip()

        if email not in users:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        hashed = hash_password(request.password)
        if users[email]["password"] != hashed:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        return {
            "success": True,
            "message": "Login successful.",
            "user": {
                "email": email,
                "name": users[email].get("name", ""),
            },
            # Simple token: in production replace with real JWT
            "token": hashlib.sha256(f"{email}:loggedin".encode()).hexdigest()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# ✅ NEW: REGISTER ENDPOINT
# ==========================================
@app.post("/api/register")
async def register(request: RegisterRequest):
    """
    New user registration.
    """
    try:
        users = load_users()
        email = request.email.lower().strip()

        if email in users:
            raise HTTPException(status_code=400, detail="Email already registered.")

        users[email] = {
            "password": hash_password(request.password),
            "name": request.name or "",
        }
        save_users(users)

        return {
            "success": True,
            "message": "Registration successful. Please login.",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# ✅ NEW: STREAMING ENDPOINT (already in your code, kept as-is)
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
                safe_token = token.replace("\n", "\\n")
                yield f"data: {safe_token}\n\n"
        except Exception as e:
            yield f"data: [ERROR]: {str(e)}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        token_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )


# ==========================================
# OLD ENDPOINTS (completely unchanged)
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
            safe_filename = file.filename.encode('ascii', 'ignore').decode('ascii')
            safe_filename = safe_filename.replace(" ", "_") or "upload.pdf"
            file_path = os.path.join("uploads", safe_filename)

            with open(file_path, "wb") as f:
                f.write(await file.read())

            vector_db = doc_service.process_pdf(file_path)

            if vector_db:
                pdf_context = doc_service.ask_question(
                    vector_db,
                    "Summarize all legal facts, party names, dates, and sections from this document.",
                    []
                )
                pdf_context_clean = pdf_context.encode('utf-8', errors='replace').decode('utf-8')
                final_facts = f"CONTEXT FROM PDF:\n{pdf_context_clean}\n\nUSER INSTRUCTIONS:\n{final_facts}"

            if os.path.exists(file_path):
                os.remove(file_path)
            gc.collect()

        if not final_facts.strip():
            return ["Please provide case facts or upload a PDF.", "N/A", "N/A", "N/A", "N/A", "N/A"]

        draft, judgments, arguments, timeline, affidavit, strategy = research_and_draft(
            final_facts, documentType, language
        )
        return [draft, judgments, arguments, timeline, affidavit, strategy]

    except UnicodeDecodeError as e:
        print(f"Unicode Error: {e}")
        return [f"PDF mein special characters hain jo read nahi ho sake. Plain text facts type karke try karein.", "N/A", "N/A", "N/A", "N/A", "N/A"]
    except Exception as e:
        print(f"Draft Error: {e}")
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
