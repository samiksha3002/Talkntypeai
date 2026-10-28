import hashlib
import json
import logging
import os
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi.exceptions import RequestValidationError
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from services.draft_service import (
    ask_legal_ai,
    research_and_draft,
    research_and_draft_stream,
)
from services.research_service import ResearchService
from services.document_service import DocumentService

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="TalkNType AI Python API")
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
USERS_FILE = Path("users.json")

# Include your production frontend and local development origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://talkntype.pro",
        "https://www.talkntype.pro",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    errors = []
    for e in exc.errors():
        errors.append({
            "loc": e.get("loc"),
            "msg": e.get("msg"),
            "type": e.get("type"),
        })  # raw "input" bytes ko skip kar rahe hain
    return JSONResponse(status_code=422, content={"detail": errors})

research_ai = ResearchService()
doc_service = DocumentService()
llm = ChatOpenAI(model="gpt-4o", temperature=0.3, max_tokens=1500)


class DraftRequest(BaseModel):
    facts: str = ""
    language: Optional[str] = "English"
    documentType: Optional[str] = None


class ChatRequest(BaseModel):
    query: str
    context: Optional[str] = ""
    history: List[dict] = Field(default_factory=list)


class ResearchRequest(BaseModel):
    query: str


class MarathiRequest(BaseModel):
    english_text: str


class AICommandRequest(BaseModel):
    command: str
    text: str
    context: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = ""


def load_users():
    try:
        if USERS_FILE.exists():
            with USERS_FILE.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
                return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError) as exc:
        logger.exception("Could not read users store: %s", exc)
    return {}


def save_users(users):
    temporary = USERS_FILE.with_suffix(".tmp")
    with temporary.open("w", encoding="utf-8") as handle:
        json.dump(users, handle, ensure_ascii=False)
    temporary.replace(USERS_FILE)


def hash_password(password: str) -> str:
    # Kept for compatibility with the existing users.json format.
    # For a public production service, migrate to Argon2/bcrypt and real sessions.
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def clean_upload_name(filename: Optional[str]) -> str:
    name = Path(filename or "document.pdf").name
    return "".join(ch for ch in name if ch.isalnum() or ch in "._- ")[:120] or "document.pdf"


async def save_pdf_upload(file: UploadFile) -> Path:
    filename = clean_upload_name(file.filename)
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")
    path = UPLOAD_DIR / f"{uuid.uuid4().hex}_{filename}"
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded PDF is empty.")
    if not data.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid PDF.")
    path.write_bytes(data)
    return path


@app.get("/")
async def root():
    return {"success": True, "service": "TalkNType AI Python API"}


@app.get("/health")
async def health():
    return {
        "success": True,
        "document_loaded": doc_service.get_active_db() is not None,
    }


@app.post("/api/login")
async def login(request: LoginRequest):
    users = load_users()
    email = request.email.lower().strip()
    record = users.get(email)
    if not record or record.get("password") != hash_password(request.password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return {
        "success": True,
        "message": "Login successful.",
        "user": {"email": email, "name": record.get("name", "")},
        # Compatibility token only; replace with real JWT/session authentication.
        "token": hashlib.sha256(f"{email}:loggedin".encode()).hexdigest(),
    }


@app.post("/api/register")
async def register(request: RegisterRequest):
    email = request.email.lower().strip()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Please provide a valid email.")
    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    users = load_users()
    if email in users:
        raise HTTPException(status_code=400, detail="Email already registered.")
    users[email] = {"password": hash_password(request.password), "name": request.name or ""}
    try:
        save_users(users)
    except OSError as exc:
        logger.exception("Could not save user")
        raise HTTPException(status_code=500, detail="Could not save registration.") from exc
    return {"success": True, "message": "Registration successful. Please login."}


@app.post("/api/generate-legal-draft-stream")
async def generate_draft_stream(request: Request):
    """
    Accept JSON or multipart FormData. Parsing manually is intentional: declaring
    Form fields in the function signature would make JSON requests fail validation.
    """
    content_type = request.headers.get("content-type", "").lower()
    uploaded_file = None
    facts = ""
    language = "English"
    document_type = None
    uploaded_path = None
    try:
        if "application/json" in content_type:
            raw = await request.body()
            try:
                body = json.loads(raw.decode("utf-8", errors="replace"))
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid JSON body.")
            draft_request = DraftRequest.model_validate(body)
            facts = draft_request.facts
            language = draft_request.language or "English"
            document_type = draft_request.documentType
        elif "multipart/form-data" in content_type:
            form = await request.form()
            facts = str(form.get("facts") or "")
            language = str(form.get("language") or "English")
            document_type = form.get("documentType")
            candidate = form.get("file")
            if candidate is not None and hasattr(candidate, "read") and hasattr(candidate, "filename"):
                uploaded_file = candidate
        else:
            raise HTTPException(
                status_code=415,
                detail="Use application/json or multipart/form-data for draft generation.",
            )

        final_facts = facts or ""
        if uploaded_file is not None:
            uploaded_path = await save_pdf_upload(uploaded_file)
            vector_db = doc_service.process_pdf(str(uploaded_path))
            if vector_db is None:
                raise HTTPException(
                    status_code=422,
                    detail=doc_service.last_error or "The uploaded PDF could not be analyzed.",
                )
            pdf_summary = doc_service.ask_question(
                vector_db,
                "Summarize the document's key facts, parties, dates, case numbers, legal provisions, and procedural history. Clearly flag anything uncertain.",
                [],
            )
            final_facts = (
                f"DOCUMENT CONTENT / SUMMARY:\n{pdf_summary}\n\n"
                f"USER INSTRUCTIONS:\n{final_facts}"
            ).strip()
        if not final_facts.strip():
            raise HTTPException(status_code=400, detail="Enter case facts or upload a PDF.")

        def token_generator():
            try:
                for token in research_and_draft_stream(
                    final_facts, document_type, language or "English"
                ):
                    # Frontend expects escaped newlines within SSE data records.
                    safe_token = str(token).replace("\r\n", "\n").replace("\r", "\n").replace("\n", "\\n")
                    yield f"data: {safe_token}\n\n"
            except Exception:
                logger.exception("Streaming legal draft failed")
                yield "data: [ERROR] Draft generation failed on the server.\n\n"
            finally:
                yield "data: [DONE]\n\n"

        return StreamingResponse(
            token_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Could not start draft stream")
        raise HTTPException(status_code=500, detail="Could not start draft generation.") from exc
    finally:
        if uploaded_path and uploaded_path.exists():
            try:
                uploaded_path.unlink()
            except OSError:
                logger.warning("Could not remove temporary upload %s", uploaded_path)


@app.post("/api/analyze-document")
async def analyze_doc(file: UploadFile = File(...)):
    uploaded_path = None
    try:
        uploaded_path = await save_pdf_upload(file)
        vector_db = doc_service.process_pdf(str(uploaded_path))
        if vector_db is None:
            raise HTTPException(
                status_code=422,
                detail=doc_service.last_error or "PDF analysis failed. Please try another PDF.",
            )
        timeline = doc_service.get_timeline(vector_db)
        if not timeline or timeline.startswith("Analysis failed.") or timeline.startswith("Timeline generation failed:"):
            # The PDF may still be loaded, so return the timeline diagnostic without
            # falsely claiming that timeline generation succeeded.
            return JSONResponse(
                status_code=200,
                content={"success": True, "timeline": timeline, "warning": "PDF loaded, but timeline generation was incomplete."},
            )
        return {"success": True, "timeline": timeline}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("PDF analysis failed")
        raise HTTPException(status_code=500, detail="PDF analysis failed. Check server logs.") from exc
    finally:
        if uploaded_path and uploaded_path.exists():
            try:
                uploaded_path.unlink()
            except OSError:
                logger.warning("Could not remove temporary upload %s", uploaded_path)


@app.post("/api/chat-with-pdf")
async def chat_with_pdf(request: ChatRequest):
    query = request.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Enter a question about the document.")

    try:
        vector_db = doc_service.get_active_db()
        if vector_db is not None:
            answer = doc_service.ask_question(vector_db, query, request.history)
            if answer:
                return {"answer": answer, "source": "document"}
        # A short generic error context must never be treated as document evidence.
        fallback_context = (request.context or "").strip()
        invalid_contexts = {
            "analysis failed. document could not be read.",
            "error: please upload and analyze pdf again.",
            "please upload and analyze pdf again.",
        }
        if fallback_context and fallback_context.lower() not in invalid_contexts:
            history_text = "\n".join(
                f"{'User' if item.get('role') == 'user' else 'Assistant'}: "
                f"{item.get('content') or item.get('text') or ''}"
                for item in request.history[-6:]
            )
            response = llm.invoke([
                ("system", "You are a careful Indian legal document assistant. Answer only from the provided document context. If the context does not contain the answer, say so. Do not invent facts or legal citations."),
                ("human", f"DOCUMENT CONTEXT:\n{fallback_context}\n\nRECENT CHAT:\n{history_text}\n\nQUESTION:\n{query}"),
            ])
            return {"answer": response.content, "source": "provided_context"}
        raise HTTPException(
            status_code=409,
            detail=doc_service.last_error or "No analyzed PDF is available. Upload and analyze the PDF again.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("PDF chat failed")
        raise HTTPException(status_code=500, detail="Could not answer from the PDF. Please analyze it again.") from exc


@app.post("/api/generate-legal-draft")
async def generate_draft(
    facts: Optional[str] = Form(None),
    language: Optional[str] = Form("English"),
    documentType: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    uploaded_path = None
    try:
        final_facts = facts or ""
        if file is not None:
            uploaded_path = await save_pdf_upload(file)
            vector_db = doc_service.process_pdf(str(uploaded_path))
            if vector_db is None:
                raise HTTPException(
                    status_code=422,
                    detail=doc_service.last_error or "The uploaded PDF could not be analyzed.",
                )
            pdf_summary = doc_service.ask_question(
                vector_db,
                "Summarize the legal facts, party names, dates, case numbers, legal provisions, and procedural history.",
                [],
            )
            final_facts = f"CONTEXT FROM PDF:\n{pdf_summary}\n\nUSER INSTRUCTIONS:\n{final_facts}"
        if not final_facts.strip():
            raise HTTPException(status_code=400, detail="Please provide case facts or upload a PDF.")
        result = research_and_draft(final_facts, documentType, language or "English")
        return list(result)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Draft generation failed")
        raise HTTPException(status_code=500, detail="Draft generation failed. Check server logs.") from exc
    finally:
        if uploaded_path and uploaded_path.exists():
            try:
                uploaded_path.unlink()
            except OSError:
                logger.warning("Could not remove temporary upload %s", uploaded_path)


@app.post("/api/ai-command")
async def handle_ai_command(request: AICommandRequest):
    try:
        response = llm.invoke([
            ("system", "You are a senior legal draftsman. Modify only the selected text according to the command. Preserve the legal meaning, facts, names, dates, and citations. Do not invent authorities."),
            ("human", f"CONTEXT:\n{request.context}\n\nCOMMAND:\n{request.command}\n\nSELECTED TEXT:\n{request.text}"),
        ])
        return {"success": True, "newText": response.content}
    except Exception as exc:
        logger.exception("AI command failed")
        raise HTTPException(status_code=500, detail="AI command failed.") from exc


@app.post("/api/legal-research")
async def legal_research(request: ResearchRequest):
    try:
        return research_ai.perform_research(request.query)
    except Exception as exc:
        logger.exception("Legal research failed")
        raise HTTPException(status_code=500, detail="Legal research failed.") from exc


@app.post("/api/translate-research-marathi")
async def translate_research(request: MarathiRequest):
    try:
        return {"success": True, "marathi_summary": research_ai.get_marathi_summary(request.english_text)}
    except Exception as exc:
        logger.exception("Marathi translation failed")
        raise HTTPException(status_code=500, detail="Translation failed.") from exc


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
