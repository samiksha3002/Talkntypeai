// Synthetic-only Chrome/React/Quill tests. No microphone, MongoDB or live providers.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import {spawn} from 'node:child_process';
const root=process.cwd();const require=createRequire(path.join(root,'package.json'));const express=require('express'),esbuild=require('esbuild');
const {default:fontRouter}=await import(pathToFileURL(path.join(root,'routes/fontConvert.js')));
const app=express();app.use(express.json());const requests=[];
const fontArtifacts=new Map();
app.post('/font-artifacts/:name',express.raw({type:'application/octet-stream',limit:'20mb'}),(req,res)=>{
  if(!['font.pdf','font.docx'].includes(req.params.name))return res.sendStatus(400);
  fontArtifacts.set(req.params.name,req.body);res.json({ok:true});
});
const progress=[];app.post('/__record',(req,res)=>{progress.push(req.body);console.log('Browser check:',req.body.bug,req.body.name,req.body.pass?'PASS':'FAIL');res.json({ok:true})});
app.get('/config.json',(req,res)=>res.json({API_URL:origin}));app.get('/__requests',(req,res)=>res.json(requests));
app.use('/api/font',(req,res,next)=>{requests.push(req.body);next()},fontRouter);
app.get('/editor-fonts.css',(req,res)=>res.type('css').send(fs.readFileSync(path.join(root,'src/index.css'),'utf8')));
app.get('/KRDEV010.ttf',(req,res)=>res.sendFile(path.join(root,'public/KRDEV010.ttf')));
let bundle='';app.get('/fixture.js',(req,res)=>res.type('js').send(bundle));app.get(/.*/,(req,res)=>res.type('html').send('<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>'));
const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const origin='http://127.0.0.1:'+server.address().port;
const providerStub='export const LiveTranscriptionEvents={Open:"open",Transcript:"transcript",Error:"error",Close:"close"}; export function createClient(){return {listen:{live(){const callbacks={};const connection={on(event,callback){callbacks[event]=callback;if(event==="open")setTimeout(callback,0);return connection},getReadyState(){return 1},send(){window.__audioOrder.push("send")},requestClose(){window.__audioOrder.push("close");if(window.__stopFinal){callbacks.transcript(window.__stopFinal);window.__stopFinal=null}callbacks.close?.()}};window.__emitDeepgram=data=>callbacks.transcript(data);return connection}}}}';
const built=await esbuild.build({entryPoints:[process.argv.includes('--autosave') ? 'tests/fixtures/editor-autosave-browser.jsx' : process.argv.includes('--kruti') ? 'tests/fixtures/kruti-editor-browser.jsx' : 'tests/fixtures/h2h3-browser.jsx'],bundle:true,write:false,format:'iife',loader:{'.css':'empty','.jpg':'dataurl','.png':'dataurl'},define:{'import.meta.env.VITE_API_URL':JSON.stringify(origin),'import.meta.env.VITE_DRAFT_API_URL':JSON.stringify(origin),'import.meta.env.VITE_TNT_AI_API_URL':JSON.stringify(origin+'/api/chat'),'process.env.NODE_ENV':JSON.stringify('production')},plugins:[{name:'synthetic-speech',setup(build){build.onResolve({filter:/speechCredential\.js$/},()=>process.argv.includes('--kruti') ? undefined : ({path:'synthetic-credential',namespace:'synthetic-credential'}));build.onLoad({filter:/.*/,namespace:'synthetic-credential'},()=>({contents:'export const DEEPGRAM_ENABLED=true; export async function getSpeechCredential(){return "synthetic-not-a-secret"}'}));build.onResolve({filter:/^@deepgram\/sdk$/},()=>({path:'synthetic-deepgram',namespace:'synthetic'}));build.onLoad({filter:/.*/,namespace:'synthetic'},()=>({contents:providerStub,loader:'js'}))}}],logLevel:'silent'});bundle=built.outputFiles[0].text;
const child=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new','--disable-gpu','--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run','--no-default-browser-check','--proxy-server=http://127.0.0.1:9','--proxy-bypass-list=127.0.0.1;localhost','--user-data-dir='+fs.mkdtempSync(path.join(os.tmpdir(),'h2h3-browser-profile-')),'--dump-dom','--virtual-time-budget=30000',origin],{windowsHide:true,stdio:['ignore','pipe','pipe']});let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',()=>{});const timeout=setTimeout(()=>child.kill(),60000);await new Promise(resolve=>child.once('exit',resolve));clearTimeout(timeout);server.close();
const match=output.match(/<pre id="verification-result">([\s\S]*?)<\/pre>/);if(!match){console.log('Browser harness incomplete; completed checks:',progress.length);process.exitCode=1}else{const results=JSON.parse(match[1].replaceAll('&quot;','"').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>'));console.log(JSON.stringify(results,null,2));for(const bug of [...new Set(results.map(r=>r.bug))])console.log(bug+':',results.filter(r=>r.bug===bug&&r.pass).length,'PASS;',results.filter(r=>r.bug===bug&&!r.pass).length,'FAIL');if(results.some(r=>!r.pass))process.exitCode=1;}
if(process.argv.includes('--kruti')){
  try{
    const {unzipSync,strFromU8}=await import('fflate');
    const xml=strFromU8(unzipSync(fontArtifacts.get('font.docx'))['word/document.xml']);
    if(!xml.includes('w:ascii="KrutiDev"')||!xml.includes('English')||!xml.includes('नमस्ते')||!xml.includes('ueLrs'))throw Error('Word legacy/Unicode font content missing');
    console.log('Export artifact: Word mixed legacy/Unicode text and font mapping PASS');
    const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loader=getDocument({data:Uint8Array.from(fontArtifacts.get('font.pdf')),isEvalSupported:false});
    try{
      const pdf=await loader.promise,page=await pdf.getPage(1);
      const text=(await page.getTextContent()).items.map(item=>item.str).join('');
      if(!text.includes('ueLrs')||!text.includes('English')||!text.includes('नमस्ते'))throw Error('PDF legacy/Unicode text missing');
      const viewport=page.getViewport({scale:1}),target=pdf.canvasFactory.create(viewport.width,viewport.height);
      try{
        await page.render({canvasContext:target.context,viewport}).promise;
        const pixels=target.context.getImageData(0,0,viewport.width,viewport.height).data;let dark=0;
        for(let i=0;i<pixels.length;i+=4)if(pixels[i]<180&&pixels[i+1]<180&&pixels[i+2]<180)dark++;
        if(dark<200)throw Error('PDF raster is blank');
        const proof=path.join(os.tmpdir(),'tnt-legacy-font-proof-'+process.pid+'.png');
        fs.writeFileSync(proof,target.canvas.toBuffer('image/png'));console.log('PDF visual proof:',proof);
      }finally{pdf.canvasFactory.destroy(target)}
      console.log('Export artifact: PDF mixed text extraction and nonblank raster PASS');
    }finally{await loader.destroy()}
  }catch(error){console.log('Export artifact FAIL:',error.message);process.exitCode=1}
}
