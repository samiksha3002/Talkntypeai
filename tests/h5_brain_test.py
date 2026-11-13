import asyncio
import importlib.util
import pathlib
import unittest
spec = importlib.util.spec_from_file_location('resource_protection', pathlib.Path(__file__).parents[1] / 'TNT_BRAIN/resource_protection.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class BrainBudgetTests(unittest.IsolatedAsyncioTestCase):
    async def request(self, middleware, body=b'test'):
        sent=[]
        first=True
        async def receive():
            nonlocal first
            if first:
                first=False
                return {'type':'http.request','body':body,'more_body':False}
            await asyncio.sleep(10)
            return {'type':'http.disconnect'}
        await middleware({'type':'http','method':'POST','path':'/api/analyze-document','client':('127.0.0.1',1)},receive,sent.append_async if hasattr(sent,'append_async') else self.sender(sent))
        return sent
    def sender(self, sent):
        async def send(message): sent.append(message)
        return send
    async def test_valid_body_replayed(self):
        async def app(scope,receive,send):
            self.assertEqual((await receive())['body'],b'test')
            await send({'type':'http.response.start','status':200})
            await send({'type':'http.response.body','body':b'OK'})
        messages=await self.request(module.ResourceProtection(app))
        self.assertEqual(messages[0]['status'],200)
    async def test_chunked_oversized_body(self):
        async def app(*args): self.fail('provider must not run')
        middleware=module.ResourceProtection(app,max_bytes=3)
        self.assertEqual((await self.request(middleware))[0]['status'],413)
        self.assertEqual(middleware.active,0)
    async def test_rate_budget(self):
        async def app(scope,receive,send): await send({'type':'http.response.start','status':200})
        middleware=module.ResourceProtection(app,rate=1)
        await self.request(middleware)
        self.assertEqual((await self.request(middleware))[0]['status'],429)
    async def test_concurrency(self):
        started=asyncio.Event();release=asyncio.Event()
        async def app(*args): started.set();await release.wait()
        middleware=module.ResourceProtection(app,concurrency=1)
        first=asyncio.create_task(self.request(middleware));await started.wait()
        self.assertEqual((await self.request(middleware))[0]['status'],503)
        release.set();await first;self.assertEqual(middleware.active,0)
    async def test_timeout_retains_slot(self):
        release=asyncio.Event();sent=[]
        async def app(*args): await release.wait()
        middleware=module.ResourceProtection(app,timeout=.01,concurrency=1)
        async def receive(): return {'type':'http.request','body':b'test'}
        task=asyncio.create_task(middleware({'type':'http','method':'POST','path':'/api/ai-command','client':('local',1)},receive,self.sender(sent)))
        await asyncio.sleep(.03)
        self.assertEqual(sent[0]['status'],504);self.assertEqual(middleware.active,1)
        release.set();await task;self.assertEqual(middleware.active,0)
    async def test_failure_releases_slot(self):
        async def app(*args): raise ValueError('synthetic failure')
        middleware=module.ResourceProtection(app)
        with self.assertRaises(ValueError): await self.request(middleware)
        self.assertEqual(middleware.active,0)


class BrainUploadTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        import ast, tempfile, uuid, fitz
        from pathlib import Path
        from fastapi import HTTPException
        from typing import Optional
        self.temp = tempfile.TemporaryDirectory()
        self.directory = Path(self.temp.name)
        self.fitz = fitz
        source = Path(__file__).parents[1] / 'TNT_BRAIN/server.py'
        nodes = [node for node in ast.parse(source.read_text(encoding='utf-8')).body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name in ('clean_upload_name','save_pdf_upload')]
        self.namespace = {'Path':Path,'Optional':Optional,'UploadFile':object,'HTTPException':HTTPException,'uuid':uuid,'fitz':fitz,'setting':module.setting,'UPLOAD_DIR':self.directory}
        exec(compile(ast.Module(body=nodes,type_ignores=[]),str(source),'exec'),self.namespace)
    async def asyncTearDown(self): self.temp.cleanup()
    def file(self, data):
        class Upload:
            filename='synthetic.pdf'
            closed=False
            offset=0
            async def read(self, size):
                chunk=data[self.offset:self.offset+size];self.offset+=len(chunk);return chunk
            async def close(self): self.closed=True
        return Upload()
    async def test_real_local_pdf_validation_and_cleanup_ownership(self):
        doc=self.fitz.open();doc.new_page();data=doc.tobytes();doc.close()
        file=self.file(data);path=await self.namespace['save_pdf_upload'](file)
        self.assertEqual(path.read_bytes(),data);self.assertTrue(file.closed)
    async def test_invalid_pdf_removes_partial_file(self):
        file=self.file(b'not pdf')
        with self.assertRaises(Exception): await self.namespace['save_pdf_upload'](file)
        self.assertFalse(list(self.directory.iterdir()));self.assertTrue(file.closed)
    async def test_oversized_pdf_removes_partial_file(self):
        self.namespace['setting']=lambda key,default:1 if key=='DOCUMENT_UPLOAD_MB' else default
        file=self.file(b'%PDF-'+b'x'*(1024*1024))
        with self.assertRaises(Exception) as caught: await self.namespace['save_pdf_upload'](file)
        self.assertEqual(caught.exception.status_code,413);self.assertFalse(list(self.directory.iterdir()))
    async def test_pdf_page_limit(self):
        self.namespace['setting']=lambda key,default:1 if key=='DOCUMENT_MAX_PAGES' else default
        doc=self.fitz.open();doc.new_page();doc.new_page();file=self.file(doc.tobytes());doc.close()
        with self.assertRaises(Exception) as caught: await self.namespace['save_pdf_upload'](file)
        self.assertEqual(caught.exception.status_code,413);self.assertFalse(list(self.directory.iterdir()))

if __name__=='__main__': unittest.main()
