// Local synthetic documents only. No app backend, DB, customer profile or external network.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
const express = require('express'), esbuild = require('esbuild');
const app = express(), requests = [];
let printHTML = '', bundle = '';
app.use(express.text({ type: 'text/plain', limit: '2mb' }));
app.post('/print-html', (req,res) => { printHTML = req.body; res.sendStatus(200); });
app.get('/print-output', (req,res) => res.type('html').send(printHTML));
app.get('/requests', (req,res) => res.json(requests));
app.get('/config.json', (req,res) => res.json({ API_URL: origin }));
app.get('/api/judgements/search', (req,res) => { requests.push(req.query); res.json({ results: [], total: 0 }); });
app.get('/api/judgements/latest', (req,res) => res.json({ results: [] }));
app.get('/api/cases/user/:id', (req,res) => res.json({ success: true, cases: [] }));
app.get('/api/inquiries', (req,res) => res.json([]));
app.get('/KRDEV010.ttf', (req,res) => res.sendFile(path.resolve('public/KRDEV010.ttf')));
app.get('/quill.css', (req,res) => res.type('css').send(fs.readFileSync(require.resolve('react-quill-new/dist/quill.snow.css'),'utf8')));
app.get('/editor.css', (req,res) => res.type('css').send(fs.readFileSync('src/index.css','utf8')));
app.get('/fixture.js', (req,res) => res.type('js').send(bundle));
app.get('/', (req,res) => res.type('html').send('<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/quill.css"><link rel="stylesheet" href="/editor.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>'));
const server = app.listen(0,'127.0.0.1');
await new Promise(resolve => server.once('listening',resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const profile = fs.mkdtempSync(path.join(os.tmpdir(),'tnt-pending-browser-'));
let chrome, ws;
const sleep = ms => new Promise(resolve => setTimeout(resolve,ms));
try {
  const built = await esbuild.build({ entryPoints: ['tests/fixtures/pending-fixes-browser.jsx'], bundle: true, write: false, format: 'iife', loader: { '.css': 'empty', '.png': 'dataurl', '.jpg': 'dataurl' }, define: {
    'import.meta.env': JSON.stringify({DEV:true,PROD:false,VITE_LEGACY_FONT_PREVIEW:'true'}),
    'import.meta.env.VITE_API_URL': JSON.stringify(origin), 'import.meta.env.VITE_DRAFT_API_URL': JSON.stringify(origin),
    'import.meta.env.VITE_TNT_AI_API_URL': JSON.stringify(origin + '/api/chat'), 'import.meta.env.DEV': 'true', 'import.meta.env.PROD': 'false', 'import.meta.env.VITE_LEGACY_FONT_PREVIEW': JSON.stringify('true'), 'process.env.NODE_ENV': JSON.stringify('production'),
  }, plugins: [{ name: 'raw-css', setup(build) {
    build.onResolve({ filter: /\.css\?raw$/ }, args => ({ path: require.resolve(args.path.slice(0,-4)), namespace: 'raw-css' }));
    build.onLoad({ filter: /.*/, namespace: 'raw-css' }, args => ({ contents: fs.readFileSync(args.path,'utf8'), loader: 'text' }));
  } }], logLevel: 'silent' });
  bundle = built.outputFiles[0].text;
  chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new','--disable-gpu','--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run','--no-default-browser-check','--proxy-server=http://127.0.0.1:9','--proxy-bypass-list=127.0.0.1;localhost','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'], { windowsHide: true, stdio: 'ignore' });
  for(let i=0;i<100&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));i++) await sleep(100);
  const port = fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  ws = new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  let id=0; const pending=new Map();
  ws.onmessage=event=>{const message=JSON.parse(event.data);if(message.method==='Runtime.exceptionThrown')console.log('Browser exception:',message.params.exceptionDetails.text,message.params.exceptionDetails.exception?.description);if(message.id){const task=pending.get(message.id);pending.delete(message.id);if(message.error)task?.reject(Error(message.error.message));else task?.resolve(message.result);}};
  const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});
  const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:origin});
  let results;
  for(let i=0;i<300;i++){results=await evaluate('window.__results');if(results)break;await sleep(100);}
  if(!results){console.log(await evaluate('({url:location.href,html:document.body.innerHTML.slice(0,1500)})'));throw Error('Browser checks timed out');}
  for(const result of results)console.log(`${result.pass?'PASS':'FAIL'} ${result.name}`);
  if(results.some(r=>!r.pass))throw Error('Browser regression failure');
  await send('Page.navigate',{url:origin+'/print-output'});
  for(let i=0;i<100;i++){if(await evaluate('location.pathname === "/print-output" && document.readyState === "complete" && !!document.querySelector(".ql-editor")'))break;await sleep(50);}
  await evaluate('document.fonts.ready.then(() => true)');
  await send('Emulation.setEmulatedMedia',{media:'print'});
  const preview = await evaluate(`({width:document.querySelector('.ql-editor').getBoundingClientRect().width, family:getComputedStyle(document.querySelector('.ql-font-krutidev')).fontFamily, lists:document.querySelectorAll('li').length})`);
  if(!preview.family.includes('KrutiDev')||preview.lists!==3)throw Error('Print media typography/list regression');
  const pdf = await send('Page.printToPDF',{preferCSSPageSize:true,printBackground:true,displayHeaderFooter:false});
  const pdfData=Buffer.from(pdf.data,'base64');
  const {PDFDocument}=await import('pdf-lib');
  const parsed=await PDFDocument.load(pdfData);const size=parsed.getPage(0).getSize();
  if(Math.abs(size.width-595.28)>1||Math.abs(size.height-841.89)>1)throw Error('PDF is not A4');
  const proof=path.join(os.tmpdir(),'tnt-print-proof-'+process.pid);
  fs.writeFileSync(proof+'.pdf',pdfData);
  const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loader=getDocument({data:Uint8Array.from(pdfData),isEvalSupported:false});
  try {
    const document=await loader.promise,page=await document.getPage(1),text=(await page.getTextContent()).items.map(i=>i.str).join(' ').replace(/\s+/g,' ');
    if(!text.includes('English affidavit')||!text.includes('LEGAL')||!text.includes('Last paragraph'))throw Error('Printed PDF text missing: ' + text);
    const viewport=page.getViewport({scale:1.3}),canvas=document.canvasFactory.create(viewport.width,viewport.height);
    try{await page.render({canvasContext:canvas.context,viewport}).promise;fs.writeFileSync(proof+'.png',canvas.canvas.toBuffer('image/png'));}finally{document.canvasFactory.destroy(canvas);}
  }finally{await loader.destroy();}
  console.log('PASS Chrome print media and A4 PDF output with mixed text/lists/fonts');
  console.log('Print proof:',proof+'.png');
  await evaluate(`(() => { const root=document.querySelector('.ql-editor');for(let i=0;i<90;i++){const paragraph=document.createElement('p');paragraph.textContent='Disposable continuation paragraph '+i;root.appendChild(paragraph);} })()`);
  const longPDF=await send('Page.printToPDF',{preferCSSPageSize:true,printBackground:true,displayHeaderFooter:false});
  const longLoader=getDocument({data:Uint8Array.from(Buffer.from(longPDF.data,'base64')),isEvalSupported:false});
  try {
    const document=await longLoader.promise;
    if(document.numPages<3)throw Error('Long document did not paginate');
    for(let i=1;i<=document.numPages;i++) {
      const page=await document.getPage(i),items=(await page.getTextContent()).items.filter(item=>item.str.trim());
      if(!items.length||items.some(item=>item.transform[5]<70||item.transform[5]>page.view[3]-70))throw Error('Content escaped repeating page margins');
    }
    console.log('PASS Multi-page A4 output keeps top/bottom margins on every page');
  } finally { await longLoader.destroy(); }
  console.log(`${results.length+2} PASS; 0 FAIL`);
} catch(error) { console.error(error.message); process.exitCode=1; }
finally { ws?.close(); chrome?.kill(); server.close(); }
