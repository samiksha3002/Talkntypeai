"""Real PDF/request retrieval with deterministic local providers; no network or DB."""
import asyncio
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]/'TNT_BRAIN'))
import fitz
import httpx
from fastapi import FastAPI
from langchain_core.embeddings import Embeddings
from workspace_routes import create_workspace_router
from workspace_boundary import WorkspaceBoundary
from document_containment import DocumentContainment
from services.request_documents import RequestDocuments

class LocalEmbeddings(Embeddings):
    def embed_documents(self,texts): return [[1.0,0.5,0.2] for t in texts]
    def embed_query(self,text): return [1.0,0.5,0.2]
class LocalModel:
    def invoke(self,messages):
        content = '\n'.join(str(getattr(m,'content',m)) for m in messages)
        return type('Answer',(),{'content':content})()
def service():
    obj=RequestDocuments.__new__(RequestDocuments)
    obj.embeddings=LocalEmbeddings()
    obj.llm_answer=obj.llm_timeline=obj.llm_vision=LocalModel()
    obj.last_error=None
    return obj
def draft(facts,kind,language):
    yield '---DRAFT---\n'+facts+'\n---AFFIDAVIT---\nVerified facts\n---JUDGMENTS---\nNo verified authority\n---ARGUMENTS---\nReview facts\n---STRATEGY---\nLegal review\n---TIMELINE---\nDate unclear'
def pdf(marker,pages=1):
    doc=fitz.open()
    for i in range(pages): doc.new_page().insert_text((50,80),marker+' '+('Synthetic legal agreement facts. '*5))
    value=doc.tobytes();doc.close();return value

def app():
    instance=FastAPI();instance.include_router(create_workspace_router(service,draft));instance.add_middleware(DocumentContainment);instance.add_middleware(WorkspaceBoundary);return instance

class WorkspaceTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        os.environ['LEGAL_AI_SERVICE_KEY']='synthetic-key-'+'x'*32
        self.client=httpx.AsyncClient(transport=httpx.ASGITransport(app=app()),base_url='http://local')
    async def asyncTearDown(self): await self.client.aclose()
    def headers(self,owner='a'*24): return {'X-Legal-Service-Key':os.environ['LEGAL_AI_SERVICE_KEY'],'X-Legal-Owner':owner}
    async def post(self,action,marker,owner='a'*24,**fields):
        return await self.client.post('/internal/legal-workspace/'+action,headers=self.headers(owner),files={'file':('case.pdf',pdf(marker),'application/pdf')},data=fields)
    async def test_two_user_interleaved_pdf_chat(self):
        for owner,marker in [('a'*24,'ALPHA-PRIVATE'),('b'*24,'BETA-PRIVATE')]:
            result=await self.post('analyze-document',marker,owner)
            self.assertEqual(result.status_code,200,result.text);self.assertIn(marker,result.json()['timeline'])
        results=[await self.post('chat-with-pdf','ALPHA-PRIVATE',query='Who are the parties?'),await self.post('chat-with-pdf','BETA-PRIVATE','b'*24,query='Who are the parties?')]
        for result,yes,no in [(results[0],'ALPHA-PRIVATE','BETA-PRIVATE'),(results[1],'BETA-PRIVATE','ALPHA-PRIVATE')]:
            self.assertEqual(result.status_code,200,result.text);self.assertIn(yes,result.text);self.assertNotIn(no,result.text)
    async def test_single_workspace_slot_rejects_parallel_work_and_recovers(self):
        import threading
        entered, release = threading.Event(), threading.Event()
        def held_service():
            obj = service()
            original = obj.get_timeline
            def held(vector):
                entered.set()
                if not release.wait(5): raise RuntimeError('Test timed out')
                return original(vector)
            obj.get_timeline = held
            return obj
        instance=FastAPI()
        instance.include_router(create_workspace_router(held_service,draft))
        instance.add_middleware(WorkspaceBoundary)
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=instance),base_url='http://local') as client:
            first=asyncio.create_task(client.post('/internal/legal-workspace/analyze-document',headers=self.headers(),files={'file':('case.pdf',pdf('ALPHA-PRIVATE'),'application/pdf')}))
            try:
                for _ in range(200):
                    if entered.is_set(): break
                    await asyncio.sleep(.01)
                self.assertTrue(entered.is_set())
                second=await client.post('/internal/legal-workspace/analyze-document',headers=self.headers('b'*24),files={'file':('case.pdf',pdf('BETA-PRIVATE'),'application/pdf')})
                self.assertEqual(second.status_code,503)
            finally:
                release.set()
                result=await first
            self.assertEqual(result.status_code,200)
            retry=await client.post('/internal/legal-workspace/analyze-document',headers=self.headers('b'*24),files={'file':('case.pdf',pdf('BETA-PRIVATE'),'application/pdf')})
            self.assertEqual(retry.status_code,200)
            self.assertNotIn('ALPHA-PRIVATE',retry.text)

    async def test_eight_million_pixel_page_limit(self):
        import math
        for pixels,expected in [(7900000,200),(8100000,413)]:
            doc=fitz.open()
            side=math.sqrt(pixels)*72/200
            page=doc.new_page(width=side,height=side)
            page.insert_text((50,80),'Synthetic legal facts. '*10)
            value=doc.tobytes();doc.close()
            result=await self.client.post('/internal/legal-workspace/analyze-document',headers=self.headers(),files={'file':('dimensions.pdf',value,'application/pdf')})
            self.assertEqual(result.status_code,expected,result.text)

    async def test_no_global_or_disk_recovery_after_new_request(self):
        await self.post('analyze-document','ALPHA-PRIVATE')
        r=await self.client.post('/internal/legal-workspace/chat-with-pdf',headers=self.headers('b'*24),json={'query':'Show document'})
        self.assertEqual(r.status_code,409)
    async def test_drafting_json_pdf_and_command(self):
        for owner,marker in [('a'*24,'ALPHA-PRIVATE'),('b'*24,'BETA-PRIVATE')]:
            r=await self.client.post('/internal/legal-workspace/generate-legal-draft-stream',headers=self.headers(owner),json={'facts':marker+' contract dispute','language':'English'})
            self.assertEqual(r.status_code,200);self.assertIn(marker,r.text);self.assertIn('data: [DONE]',r.text)
            r=await self.post('generate-legal-draft-stream',marker,owner,facts='Prepare a petition',language='English')
            self.assertEqual(r.status_code,200,r.text);self.assertIn(marker,r.text)
        r=await self.client.post('/internal/legal-workspace/ai-command',headers=self.headers(),json={'command':'Clarify','text':'The rent is due','context':'Synthetic lease'})
        self.assertEqual(r.status_code,200);self.assertTrue(r.json()['success'])
    async def test_legacy_paths_still_contained(self):
        for path in DocumentContainment.paths:
            r=await self.client.post(path,headers=self.headers(),content=b'not parsed');self.assertEqual(r.status_code,503)
    async def test_authentication_denies_before_body(self):
        for headers in [{},{'X-Legal-Service-Key':'wrong','X-Legal-Owner':'a'*24},self.headers('../customer')]:
            r=await self.client.post('/internal/legal-workspace/analyze-document',headers=headers,content=b'bad');self.assertEqual(r.status_code,401)
    async def test_pdf_resource_limits_and_cleanup(self):
        before=set(Path(tempfile.gettempdir()).glob('tnt-workspace-*'))
        encrypted_doc=fitz.open(stream=pdf('ENCRYPTED'),filetype='pdf')
        encrypted=encrypted_doc.tobytes(encryption=fitz.PDF_ENCRYPT_AES_256,owner_pw='synthetic-owner',user_pw='synthetic-user')
        encrypted_doc.close()
        for value,status in [(encrypted,422),(b'not pdf',415),(pdf('Large',61),413),(b'%PDF-broken',422),(b'%PDF-'+b'x'*(10*1024*1024),413)]:
            r=await self.client.post('/internal/legal-workspace/analyze-document',headers=self.headers(),files={'file':('../../case.pdf',value,'application/pdf')});self.assertEqual(r.status_code,status,r.text)
        r=await self.post('analyze-document','CLEANUP-SUCCESS')
        self.assertEqual(r.status_code,200)
        self.assertEqual(set(Path(tempfile.gettempdir()).glob('tnt-workspace-*')),before)
    async def test_input_limits_and_unknown_owner(self):
        for body,status in [({'facts':'x'*20001},413),({'facts':'okay','ownerId':'b'*24},400),({'query':'test','history':[{}]*7},413)]:
            r=await self.client.post('/internal/legal-workspace/generate-legal-draft-stream',headers=self.headers(),json=body);self.assertEqual(r.status_code,status,r.text)
    def test_no_persistent_chroma_or_recovery(self):
        source=(Path(__file__).parents[1]/'TNT_BRAIN/services/request_documents.py').read_text()
        self.assertNotIn('persist_directory',source);self.assertIsNone(service().get_active_db())

if __name__=='__main__': unittest.main()
