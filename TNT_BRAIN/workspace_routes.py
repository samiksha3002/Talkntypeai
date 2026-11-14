"""Authenticated, stateless workspace routes. Legacy document endpoints stay contained."""
import json
import logging
import traceback
import os
import tempfile
from pathlib import Path
import fitz
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from starlette.concurrency import run_in_threadpool

MAX_FILE = 10 * 1024 * 1024
logger = logging.getLogger(__name__)

def log_workspace_failure(action, error):
    # Deliberately omit exception messages, source lines, locals and request data.
    # Log each chained exception's type, numeric OS errno and traceback frames.
    chain, seen = [], set()
    while error is not None and id(error) not in seen and len(chain) < 10:
        seen.add(id(error))
        chain.append({
            'type': type(error).__module__ + '.' + type(error).__name__,
            'errno': error.errno if isinstance(error, OSError) and isinstance(error.errno, int) else None,
            'frames': [{'file': Path(f.filename).name, 'line': f.lineno, 'function': f.name}
                       for f in traceback.extract_tb(error.__traceback__)],
        })
        error = error.__cause__ or error.__context__
    logger.error('Workspace failure action=%s sanitized_traceback=%s', action, json.dumps(chain))

def text(value, maximum, name):
    if value is None: return ''
    if not isinstance(value,str) or len(value) > maximum:
        raise HTTPException(413, f'{name} exceeds the limit.')
    return value

def create_workspace_router(service_factory, draft_stream):
    router = APIRouter(prefix='/internal/legal-workspace')

    @router.post('/{action}')
    async def workspace(action: str, request: Request):
        if not request.scope.get('legal_owner'):
            raise HTTPException(401,'Unauthorized gateway.')
        if action not in {'analyze-document','chat-with-pdf','generate-legal-draft-stream','ai-command'}:
            raise HTTPException(404,'Unknown operation.')
        form = None
        content_type = request.headers.get('content-type','')
        try:
            if content_type.startswith('application/json'):
                data = await request.json()
                if not isinstance(data,dict): raise HTTPException(400,'Invalid body.')
            elif content_type.startswith('multipart/form-data;'):
                form = await request.form(max_files=1,max_fields=8,max_part_size=100000)
                data = dict(form)
            else: raise HTTPException(415,'Use JSON or multipart.')
            allowed = {'file','facts','language','documentType','query','context','history','command','text'}
            if set(data)-allowed: raise HTTPException(400,'Unknown fields.')
            facts = text(data.get('facts'),20000,'Facts')
            query = text(data.get('query'),4000,'Question')
            context = text(data.get('context'),30000,'Context')
            selected = text(data.get('text'),20000,'Selected text')
            command = text(data.get('command'),1000,'Command')
            language = text(data.get('language'),40,'Language') or 'English'
            document_type = text(data.get('documentType'),200,'Document type')
            history = data.get('history',[])
            if isinstance(history,str):
                try: history = json.loads(history)
                except ValueError: raise HTTPException(400,'Invalid history.')
            if not isinstance(history,list) or len(history)>6: raise HTTPException(413,'History limit exceeded.')
            for item in history:
                if not isinstance(item,dict) or item.get('role') not in {'user','assistant','ai'}: raise HTTPException(400,'Invalid history.')
                text(item.get('text',item.get('content')),4000,'History item')
            service = service_factory()
            upload = data.get('file')
            vector = None
            if upload is not None:
                if not hasattr(upload,'read'): raise HTTPException(400,'Invalid PDF upload.')
                # Private directory and exclusive file, always removed after processing.
                with tempfile.TemporaryDirectory(prefix='tnt-workspace-') as directory:
                    path = Path(directory)/'document.pdf'
                    with path.open('xb') as output:
                        os.chmod(path,0o600)
                        total = 0
                        while chunk := await upload.read(65536):
                            if total == 0 and not chunk.startswith(b'%PDF-'): raise HTTPException(415,'Invalid PDF.')
                            total += len(chunk)
                            if total > MAX_FILE: raise HTTPException(413,'PDF exceeds 10 MB.')
                            output.write(chunk)
                    if not total: raise HTTPException(400,'Empty PDF.')
                    try:
                        with fitz.open(path) as pdf:
                            if pdf.is_encrypted: raise HTTPException(422,'Encrypted PDF.')
                            if not 1 <= len(pdf) <= 60: raise HTTPException(413,'PDF exceeds 60 pages.')
                            pixels = [p.rect.width*p.rect.height*(200/72)**2 for p in pdf]
                            if any(not 0 < p <= 8000000 for p in pixels) or sum(pixels)>300000000:
                                raise HTTPException(413,'PDF raster budget exceeded.')
                    except HTTPException: raise
                    except Exception: raise HTTPException(422,'Unreadable PDF.')
                    try: vector = await run_in_threadpool(service.process_pdf,str(path))
                    except ValueError: raise HTTPException(422,'PDF cannot be fully processed within limits.')
                    if vector is None: raise HTTPException(422,'PDF analysis failed.')
            if action == 'analyze-document':
                if vector is None: raise HTTPException(400,'Upload a PDF.')
                timeline = await run_in_threadpool(service.get_timeline,vector)
                if service.last_error or not timeline or timeline.startswith(('Analysis failed.', 'Timeline generation failed:', 'Could not retrieve')): raise HTTPException(502,'Timeline generation failed.')
                return {'success':True,'timeline':timeline}
            if action == 'chat-with-pdf':
                if not query.strip(): raise HTTPException(400,'Enter a question.')
                if vector is not None:
                    answer = await run_in_threadpool(service.ask_question,vector,query,history)
                elif context.strip():
                    # Draft workspace chat uses only this request's explicit case facts.
                    result = await run_in_threadpool(service.llm_answer.invoke,[('system','Answer only from the supplied context. Say when information is absent. Do not invent legal citations.'),('human',f'CONTEXT:\n{context}\nQUESTION:\n{query}')])
                    answer = result.content
                else: raise HTTPException(409,'Upload a PDF or supply case facts.')
                if service.last_error: raise HTTPException(502,'PDF question failed.')
                return {'answer':answer}
            if action == 'ai-command':
                if not selected.strip() or not command.strip(): raise HTTPException(400,'Select text and enter a command.')
                result = await run_in_threadpool(service.llm_answer.invoke,[('system','Modify only the selected text. Preserve facts and legal meaning. Do not invent citations.'),('human',f'CONTEXT:\n{context}\nCOMMAND:\n{command}\nTEXT:\n{selected}')])
                return {'success':True,'newText':result.content}
            if vector is not None:
                summary = await run_in_threadpool(service.ask_question,vector,'Summarize the key facts, parties, dates, case numbers and provisions. Flag uncertainty.',[])
                if service.last_error: raise HTTPException(502,'PDF summary failed.')
                facts = f'DOCUMENT SUMMARY:\n{summary}\nUSER INSTRUCTIONS:\n{facts}'
            if not facts.strip(): raise HTTPException(400,'Enter facts or upload a PDF.')
            def tokens():
                size = 0
                try:
                    for token in draft_stream(facts,document_type or None,language):
                        token = str(token)
                        size += len(token)
                        if size > 120000 or '[ERROR]' in token or '[DRAFTING ERROR]' in token:
                            raise RuntimeError('Draft failed.')
                        yield 'data: ' + token.replace('\r','').replace('\n','\\n') + '\n\n'
                    yield 'data: [DONE]\n\n'
                except Exception:
                    yield 'data: [ERROR] Draft generation failed.\n\n'
            return StreamingResponse(tokens(),media_type='text/event-stream',headers={'Cache-Control':'no-store','X-Accel-Buffering':'no'})
        except HTTPException: raise
        except Exception as error:
            log_workspace_failure(action, error)
            raise HTTPException(502,'AI processing failed. Retry shortly.') from None
        finally:
            if form is not None: await form.close()
    return router
