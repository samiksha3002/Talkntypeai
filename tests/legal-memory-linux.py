"""Linux/cgroup-only memory acceptance. Uses actual corpus, retrieval and SDKs.
Synthetic OpenAI-compatible responses run on loopback inside the same cgroup.
No production credentials, remote requests or customer data are needed.
"""
import json
import importlib.metadata
import math
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
CGROUP = Path('/sys/fs/cgroup')
LIMIT = 512 * 1024 * 1024
SAFE_PEAK = 448 * 1024 * 1024

def serve():
    os.chdir(ROOT/'TNT_BRAIN')
    sys.path.insert(0,str(ROOT/'TNT_BRAIN'))
    os.environ.update(OPENAI_API_KEY='synthetic-local-only',OPENAI_BASE_URL='http://127.0.0.1:8765/v1',TAVILY_API_KEY='synthetic-local-only',LEGAL_AI_SERVICE_KEY='synthetic-workspace-memory-key-'+'x'*32,ANONYMIZED_TELEMETRY='False')
    from fastapi import FastAPI, Request
    from fastapi.responses import StreamingResponse
    import server
    import uvicorn
    provider=FastAPI()
    calls={'embeddings':0,'chat':0,'vision':0,'stream':0}
    corpus_holder=[]
    @provider.post('/v1/embeddings')
    async def embeddings(request: Request):
        data=await request.json()
        values=data['input']
        if isinstance(values,str) or (values and isinstance(values[0],int)): values=[values]
        calls['embeddings']+=1
        return {'object':'list','model':'text-embedding-3-small','data':[{'object':'embedding','index':i,'embedding':[0.01]*1536} for i in range(len(values))],'usage':{'prompt_tokens':1,'total_tokens':1}}
    @provider.post('/v1/chat/completions')
    async def completions(request: Request):
        data=await request.json()
        calls['chat']+=1
        if any(isinstance(m.get('content'),list) for m in data['messages']): calls['vision']+=1
        content='Synthetic legal memory acceptance facts. Rent due 1 January 2026. '*45
        if data.get('stream'):
            calls['stream']+=1
            content='---DRAFT---\n'+content*5+'\n---AFFIDAVIT---\nSynthetic affidavit\n---JUDGMENTS---\nReference review required\n---ARGUMENTS---\nSynthetic argument\n---STRATEGY---\nReview\n---TIMELINE---\n1 January 2026'
            def events():
                for start in range(0,len(content),256):
                    yield 'data: '+json.dumps({'id':'synthetic','object':'chat.completion.chunk','created':0,'model':'gpt-4o','choices':[{'index':0,'delta':{'content':content[start:start+256]},'finish_reason':None}]})+'\n\n'
                yield 'data: [DONE]\n\n'
            return StreamingResponse(events(),media_type='text/event-stream')
        return {'id':'synthetic','object':'chat.completion','created':0,'model':'gpt-4o','choices':[{'index':0,'message':{'role':'assistant','content':content},'finish_reason':'stop'}],'usage':{'prompt_tokens':1,'completion_tokens':1,'total_tokens':2}}
    @provider.get('/__memory_evidence')
    async def evidence():
        import services.draft_service as drafting
        # This is the same persisted corpus and embedding adapter used by drafting.
        if not corpus_holder:
            store=drafting.Chroma(persist_directory=drafting.CHROMA_PATH,embedding_function=drafting.embeddings)
            corpus_holder.append(store)
        store=corpus_holder[0]
        references=store.similarity_search_by_vector([0.01]*1536,k=12)
        return {'provider_calls':calls,'corpus_chunks':store._collection.count(),'retrieved_reference_chunks':len(references),'pid':os.getpid()}
    class App:
        async def __call__(self,scope,receive,send):
            if scope.get('path','').startswith(('/v1/','/__memory_evidence')):
                return await provider(scope,receive,send)
            return await server.app(scope,receive,send)
    uvicorn.run(App(),host='127.0.0.1',port=8765,workers=1,log_level='warning')

def run():
    if sys.platform!='linux': raise SystemExit('BLOCKED: this test requires Linux cgroup v2.')
    maximum=(CGROUP/'memory.max').read_text().strip()
    swap=(CGROUP/'memory.swap.max').read_text().strip()
    if maximum=='max' or int(maximum)!=LIMIT or swap!='0':
        raise SystemExit('BLOCKED: require memory.max=536870912 and memory.swap.max=0.')
    import fitz
    import httpx
    checks=[]
    output=Path(os.environ.get('MEMORY_RESULTS_DIR','/results'))
    output.mkdir(parents=True,exist_ok=True)
    def progress(current):
        (output/'progress.json').write_text(json.dumps({'passed':checks,'current_test':current,'expected_flows':14}))
    child_code='import runpy; g=runpy.run_path('+repr(str(Path(__file__).resolve()))+'); g["serve"]()'
    env={**os.environ,'BRAIN_REQUESTS_PER_MINUTE':'1000','PYTHONDONTWRITEBYTECODE':'1'}
    child=subprocess.Popen([sys.executable,'-B','-c',child_code],env=env)
    try:
        with httpx.Client(base_url='http://127.0.0.1:8765',timeout=600,trust_env=False) as client:
            for _ in range(300):
                if child.poll() is not None: raise RuntimeError('Python worker exited before readiness.')
                try:
                    if client.get('/health').status_code==200: break
                except httpx.TransportError: pass
                time.sleep(.1)
            else: raise RuntimeError('Python worker startup timed out.')
            preload=client.get('/__memory_evidence')
            assert preload.status_code==200,preload.text
            assert preload.json()['corpus_chunks']==6804 and preload.json()['retrieved_reference_chunks']==12
            doc=fitz.open()
            for _ in range(60):
                page=doc.new_page()
                page.insert_textbox(fitz.Rect(30,30,560,800),'Synthetic agreement facts. Rent due January 2026. '*22,fontsize=10)
            text_pdf=doc.tobytes();doc.close()
            pix=fitz.Pixmap(fitz.csRGB,1000,1000,os.urandom(3000000),False)
            jpeg=pix.tobytes('jpeg',jpg_quality=75);del pix
            doc=fitz.open();side=math.sqrt(7900000)*72/200
            for _ in range(25):
                page=doc.new_page(width=side,height=side);page.insert_image(page.rect,stream=jpeg)
            scan_pdf=doc.tobytes();doc.close();del jpeg
            assert len(scan_pdf)<10*1024*1024
            for user_index,owner in enumerate(['a'*24,'b'*24]):
                caller=httpx.Client(base_url='http://127.0.0.1:8765',timeout=600,trust_env=False,transport=httpx.HTTPTransport(local_address='127.0.0.'+str(user_index+2)))
                headers={'X-Legal-Service-Key':'synthetic-workspace-memory-key-'+'x'*32,'X-Legal-Owner':owner}
                for kind,payload in [('text-60-pages',text_pdf),('scanned-25-pages',scan_pdf)]:
                    for action,fields in [('analyze-document',{}),('chat-with-pdf',{'query':'When is rent due?'}),('generate-legal-draft-stream',{'facts':'Prepare a synthetic agreement petition.','language':'English'})]:
                        current=kind+'/'+action+'/'+owner[0]
                        progress(current)
                        response=caller.post('/internal/legal-workspace/'+action,headers=headers,files={'file':('synthetic.pdf',payload,'application/pdf')},data=fields)
                        assert response.status_code==200,(kind,action,response.status_code,response.text[:200])
                        if action.endswith('stream'): assert '[DONE]' in response.text and '[ERROR]' not in response.text
                        checks.append(current)
                        progress(None)
                current='typed-facts-draft/'+owner[0]
                progress(current)
                response=caller.post('/internal/legal-workspace/generate-legal-draft-stream',headers=headers,json={'facts':'Synthetic typed-facts tenancy dispute.','language':'English'})
                assert response.status_code==200 and '[DONE]' in response.text and '[ERROR]' not in response.text
                checks.append(current)
                progress(None)
                caller.close()
            evidence=client.get('/__memory_evidence').json()
            assert evidence['corpus_chunks']==6804,evidence
            assert evidence['provider_calls']['vision']>=150,evidence
            assert evidence['provider_calls']['stream']==6,evidence
            assert child.poll() is None
            peak=int((CGROUP/'memory.peak').read_text())
            events=dict(line.split() for line in (CGROUP/'memory.events').read_text().splitlines())
            result={'runtime_versions':{name:importlib.metadata.version(name) for name in ['fastapi','openai','langchain-core','langchain-openai','langchain-community','chromadb','pymupdf']},'memory_max_bytes':int(maximum),'memory_swap_max_bytes':int(swap),'peak_bytes':peak,'peak_MiB':round(peak/1048576,2),'headroom_MiB':round((LIMIT-peak)/1048576,2),'oom_kills':int(events['oom_kill']),'single_worker_pid':evidence['pid'],'completed_flows':len(checks),**evidence,'providers':'loopback synthetic responses; real SDK serialization, OCR, embeddings and corpus retrieval','memory_acceptance':peak<=SAFE_PEAK and int(events['oom_kill'])==0}
            output=Path(os.environ.get('MEMORY_RESULTS_DIR','/results'))
            output.mkdir(parents=True,exist_ok=True)
            (output/'harness.json').write_text(json.dumps(result,indent=2))
            print(json.dumps(result,indent=2),flush=True)
            if not result['memory_acceptance']: raise SystemExit('HOLD: exceeds 448 MiB safety threshold or OOM observed.')
    finally:
        child.terminate()
        try:child.wait(timeout=10)
        except subprocess.TimeoutExpired:child.kill();child.wait()

if __name__=='__main__':
    try:
        run()
    except BaseException as error:
        output=Path(os.environ.get('MEMORY_RESULTS_DIR','/results'))
        if output.is_dir():
            (output/'harness-failure.json').write_text(json.dumps({'error_type':type(error).__name__,'error':str(error)[:1500]}))
        raise
