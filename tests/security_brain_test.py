import asyncio
import importlib.util
import pathlib
import unittest
spec=importlib.util.spec_from_file_location('document_containment',pathlib.Path(__file__).parents[1]/'TNT_BRAIN/document_containment.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class ContainmentTests(unittest.IsolatedAsyncioTestCase):
 async def test_document_paths_all_methods_block_before_receive_or_provider(self):
  async def unsafe(*args): self.fail('must not touch document state, body or provider')
  guard=module.DocumentContainment(unsafe)
  for path in guard.paths:
   for method in ['GET','POST','PUT','DELETE']:
    messages=[]
    async def send(message): messages.append(message)
    await guard({'type':'http','path':path,'method':method},unsafe,send)
    self.assertEqual(messages[0]['status'],503)
    self.assertIn((b'cache-control',b'no-store'),messages[0]['headers'])
 async def test_trailing_slash_is_also_blocked(self):
  async def unsafe(*args): self.fail('downstream must not run')
  messages=[]
  async def send(m): messages.append(m)
  await module.DocumentContainment(unsafe)({'type':'http','path':'/api/chat-with-pdf/'},unsafe,send)
  self.assertEqual(messages[0]['status'],503)
 async def test_unrelated_and_non_http_requests_pass(self):
  calls=[]
  async def app(scope,*args): calls.append(scope)
  async def unused(*args): pass
  guard=module.DocumentContainment(app)
  for scope in [{'type':'http','path':'/health'},{'type':'http','path':'/api/legal-research'},{'type':'lifespan'}]:await guard(scope,unused,unused)
  self.assertEqual(len(calls),3)
 def test_application_wiring_and_health_do_not_read_shared_document(self):
  import ast
  source=(pathlib.Path(__file__).parents[1]/'TNT_BRAIN/server.py').read_text(encoding='utf-8')
  self.assertIn('app.add_middleware(DocumentContainment)',source)
  health=next(n for n in ast.parse(source).body if isinstance(n,ast.AsyncFunctionDef) and n.name=='health')
  self.assertNotIn('doc_service',ast.unparse(health))
if __name__=='__main__':unittest.main()
