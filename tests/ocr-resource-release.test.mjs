import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {createRequire} from 'node:module';
import express from 'express';import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {ocrResources} from '../utils/searchablePdf.js';import {createSearchableRouter} from '../routes/searchablePdf.routes.js';import {limits} from '../utils/resourceProtection.js';
const fontPath=path.join(path.dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json')),'standard_fonts')+path.sep;
const setEnv=(name,value)=>value===undefined?delete process.env[name]:process.env[name]=value;
async function serve(run){const app=express();app.use(createSearchableRouter());const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));try{await run('http://127.0.0.1:'+server.address().port);}finally{await new Promise(r=>server.close(r));}}
async function inspect(bytes){const loading=getDocument({data:Uint8Array.from(bytes),standardFontDataUrl:fontPath,isEvalSupported:false});try{const doc=await loading.promise,text=[],pixels=[];for(let i=1;i<=doc.numPages;i++){const page=await doc.getPage(i);text.push((await page.getTextContent()).items.map(item=>item.str).join(' '));const viewport=page.getViewport({scale:.6}),target=doc.canvasFactory.create(Math.ceil(viewport.width),Math.ceil(viewport.height));try{await page.render({canvasContext:target.context,viewport}).promise;pixels.push(Buffer.from(target.context.getImageData(0,0,target.canvas.width,target.canvas.height).data));}finally{doc.canvasFactory.destroy(target);page.cleanup();}}return{text,pixels};}finally{await loading.destroy();}}
test('bundled English Hindi Marathi data does not require OCR_LANG_PATH or the launch directory',async()=>{
 const old=process.env.OCR_LANG_PATH,cwd=process.cwd(),dir=await fs.mkdtemp(path.join(os.tmpdir(),'ocr-resource-location-'));
 try{delete process.env.OCR_LANG_PATH;process.chdir(dir);assert.deepEqual((await ocrResources()).languages,['eng','hin','mar']);}
 finally{process.chdir(cwd);setEnv('OCR_LANG_PATH',old);await fs.rmdir(dir);}
});
test('incomplete explicit language directory fails before worker creation with missing languages',async()=>{
 const old=process.env.OCR_LANG_PATH,format=process.env.OCR_UNCOMPRESSED,dir=await fs.mkdtemp(path.join(os.tmpdir(),'ocr-incomplete-'));
 try{await fs.writeFile(path.join(dir,'eng.traineddata'),'not loaded');process.env.OCR_LANG_PATH=dir;process.env.OCR_UNCOMPRESSED='1';await assert.rejects(ocrResources(),error=>error.status===503&&error.message.includes('hin')&&error.message.includes('mar'));}
 finally{setEnv('OCR_LANG_PATH',old);setEnv('OCR_UNCOMPRESSED',format);await fs.unlink(path.join(dir,'eng.traineddata'));await fs.rmdir(dir);}
});
test('small scanned legal PDF returns searchable English Hindi Marathi with identical page pixels',async t=>{
 const input=await fs.readFile(new URL('./fixtures/legal-scan-a4.pdf',import.meta.url));let output,peak=process.memoryUsage().rss;const sample=setInterval(()=>{peak=Math.max(peak,process.memoryUsage().rss);},20);
 try{await serve(async base=>{const body=new FormData();body.append('file',new Blob([input],{type:'application/pdf'}),'synthetic-small-scans.pdf');const response=await fetch(base+'/pdf-to-searchable-pdf',{method:'POST',body});assert.equal(response.status,200,await response.clone().text());assert.match(response.headers.get('content-type'),/application\/pdf/);assert.ok(Number(response.headers.get('x-ocr-word-count'))>200);output=Buffer.from(await response.arrayBuffer());});}finally{clearInterval(sample);}
 const before=await inspect(input),after=await inspect(output),text=after.text.join(' ').replace(/\s+/g,' ');assert.deepEqual(after.pixels,before.pixels);assert.equal(after.text.length,3);assert.equal(text.match(/DISTRICT COURT/g)?.length,3);assert.match(text,/\u092d\u093e\u0930\u0924/);assert.match(text,/\u092e\u0930\u093e\u0920\u0940/);t.diagnostic('Sampled local process RSS during small-PDF conversion: '+(peak/1048576).toFixed(1)+' MiB; no hard memory cap was imposed.');
});
test('readiness reports all three languages and the existing configured upload limit',async()=>{await serve(async base=>{const response=await fetch(base+'/status');assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');const body=await response.json();assert.deepEqual(body.languages,['eng','hin','mar']);assert.equal(body.uploadMiB,limits.searchable/1024/1024);});});
