from workspace_boundary import WorkspaceBoundary
from workspace_routes import create_workspace_router
from services.request_documents import RequestDocuments
from document_containment import DocumentContainment
from resource_protection import ResourceProtection, setting
from brain_auth import BrainAuth
from starlette.concurrency import run_in_threadpool
import fitz
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
app.add_middleware(ResourceProtection)
app.add_middleware(DocumentContainment)
app.add_middleware(WorkspaceBoundary)
app.include_router(create_workspace_router(RequestDocuments, research_and_draft_stream))
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Browsers no longer call this service directly (the Node API proxies every request),
# so CORS only allows our own production domains, with no credentials.
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv(
    "BRAIN_ALLOWED_ORIGINS", "https://talkntype.pro,https://www.talkntype.pro").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
# Added last = outermost: every request except GET /health must come from the Node
# API with the shared secret and a verified user id (see brain_auth.py).
app.add_middleware(BrainAuth)
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


def current_user(request: Request) -> str:
    """Verified user id supplied by the Node API (checked in BrainAuth)."""
    user_id = getattr(request.state, "user_id", None)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized.")
    return user_id


def draft_owner(user_id: str) -> str:
    # PDFs uploaded for drafting are kept separate from the user's chat document.
    return f"{user_id}:draft"


def clean_upload_name(filename: Optional[str]) -> str:
    name = Path(filename or "document.pdf").name
    return "".join(ch for ch in name if ch.isalnum() or ch in "._- ")[:120] or "document.pdf"


async def save_pdf_upload(file: UploadFile) -> Path:
    filename = clean_upload_name(file.filename)
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")
    path = UPLOAD_DIR / f"{uuid.uuid4().hex}_{filename}"
    try:
        total = 0
        with path.open("wb") as output:
            while chunk := await file.read(1024 * 1024):
                if total == 0 and not chunk.startswith(b"%PDF-"):
                    raise HTTPException(status_code=415, detail="Invalid PDF content.")
                total += len(chunk)
                if total > setting("DOCUMENT_UPLOAD_MB", 50) * 1024 * 1024:
                    raise HTTPException(status_code=413, detail="PDF exceeds the upload limit.")
                output.write(chunk)
        if not total:
            raise HTTPException(status_code=400, detail="The uploaded PDF is empty.")
        with fitz.open(path) as pdf:
            if not pdf.page_count or pdf.page_count > setting("DOCUMENT_MAX_PAGES", 100):
                raise HTTPException(status_code=413, detail="PDF page limit exceeded.")
            pixels = [page.rect.width * page.rect.height * (200/72)**2 for page in pdf]
            if max(pixels) > setting("DOCUMENT_MAX_IMAGE_PIXELS", 12000000) or sum(pixels) > setting("DOCUMENT_MAX_RASTER_PIXELS", 500000000):
                raise HTTPException(status_code=413, detail="PDF rasterization budget exceeded.")
    except BaseException:
        path.unlink(missing_ok=True)
        raise
    finally:
        await file.close()
    return path


@app.get("/")
async def root():
    return {"success": True, "service": "TalkNType AI Python API"}


@app.get("/health")
async def health():
    # Public for the hosting health check; reveals nothing about users or documents.
    return {"success": True}

# The separate users.json login/register endpoints were removed: accounts live only
# in the Node API (MongoDB, bcrypt), which authenticates users before proxying here.


@app.post("/api/generate-legal-draft-stream")
async def generate_draft_stream(request: Request):
    """
    Accept JSON or multipart FormData. Parsing manually is intentional: declaring
    Form fields in the function signature would make JSON requests fail validation.
    """
    owner = draft_owner(current_user(request))
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
            vector_db = await run_in_threadpool(doc_service.process_pdf, str(uploaded_path), owner)
            if vector_db is None:
                raise HTTPException(
                    status_code=422,
                    detail=doc_service.last_error_for(owner) or "The uploaded PDF could not be analyzed.",
                )
            pdf_summary = await run_in_threadpool(doc_service.ask_question,
                vector_db,
                "Summarize the document's key facts, parties, dates, case numbers, legal provisions, and procedural history. Clearly flag anything uncertain.",
                [],
                owner,
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
async def analyze_doc(request: Request, file: UploadFile = File(...)):
    owner = current_user(request)
    uploaded_path = None
    try:
        uploaded_path = await save_pdf_upload(file)
        vector_db = await run_in_threadpool(doc_service.process_pdf, str(uploaded_path), owner)
        if vector_db is None:
            raise HTTPException(
                status_code=422,
                detail=doc_service.last_error_for(owner) or "PDF analysis failed. Please try another PDF.",
            )
        timeline = await run_in_threadpool(doc_service.get_timeline, vector_db)
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
async def chat_with_pdf(body: ChatRequest, request: Request):
    owner = current_user(request)
    query = body.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Enter a question about the document.")

    try:
        # Only this user's own analysed document is ever searched.
        vector_db = await run_in_threadpool(doc_service.get_db, owner)
        if vector_db is not None:
            answer = await run_in_threadpool(doc_service.ask_question, vector_db, query, body.history, owner)
            if answer:
                return {"answer": answer, "source": "document"}
        # A short generic error context must never be treated as document evidence.
        fallback_context = (body.context or "").strip()
        invalid_contexts = {
            "analysis failed. document could not be read.",
            "error: please upload and analyze pdf again.",
            "please upload and analyze pdf again.",
        }
        if fallback_context and fallback_context.lower() not in invalid_contexts:
            history_text = "\n".join(
                f"{'User' if item.get('role') == 'user' else 'Assistant'}: "
                f"{item.get('content') or item.get('text') or ''}"
                for item in body.history[-6:]
            )
            response = await run_in_threadpool(llm.invoke, [
                ("system", "You are a careful Indian legal document assistant. Answer only from the provided document context. If the context does not contain the answer, say so. Do not invent facts or legal citations."),
                ("human", f"DOCUMENT CONTEXT:\n{fallback_context}\n\nRECENT CHAT:\n{history_text}\n\nQUESTION:\n{query}"),
            ])
            return {"answer": response.content, "source": "provided_context"}
        raise HTTPException(
            status_code=409,
            detail=doc_service.last_error_for(owner) or "No analyzed PDF is available. Upload and analyze the PDF again.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("PDF chat failed")
        raise HTTPException(status_code=500, detail="Could not answer from the PDF. Please analyze it again.") from exc


@app.post("/api/generate-legal-draft")
async def generate_draft(
    request: Request,
    facts: Optional[str] = Form(None),
    language: Optional[str] = Form("English"),
    documentType: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    owner = draft_owner(current_user(request))
    uploaded_path = None
    try:
        final_facts = facts or ""
        if file is not None:
            uploaded_path = await save_pdf_upload(file)
            vector_db = await run_in_threadpool(doc_service.process_pdf, str(uploaded_path), owner)
            if vector_db is None:
                raise HTTPException(
                    status_code=422,
                    detail=doc_service.last_error_for(owner) or "The uploaded PDF could not be analyzed.",
                )
            pdf_summary = await run_in_threadpool(doc_service.ask_question,
                vector_db,
                "Summarize the legal facts, party names, dates, case numbers, legal provisions, and procedural history.",
                [],
                owner,
            )
            final_facts = f"CONTEXT FROM PDF:\n{pdf_summary}\n\nUSER INSTRUCTIONS:\n{final_facts}"
        if not final_facts.strip():
            raise HTTPException(status_code=400, detail="Please provide case facts or upload a PDF.")
        result = await run_in_threadpool(research_and_draft, final_facts, documentType, language or "English")
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
        response = await run_in_threadpool(llm.invoke, [
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
        return await run_in_threadpool(research_ai.perform_research, request.query)
    except Exception as exc:
        logger.exception("Legal research failed")
        raise HTTPException(status_code=500, detail="Legal research failed.") from exc


@app.post("/api/translate-research-marathi")
async def translate_research(request: MarathiRequest):
    try:
        return {"success": True, "marathi_summary": await run_in_threadpool(research_ai.get_marathi_summary, request.english_text)}
    except Exception as exc:
        logger.exception("Marathi translation failed")
        raise HTTPException(status_code=500, detail="Translation failed.") from exc


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
