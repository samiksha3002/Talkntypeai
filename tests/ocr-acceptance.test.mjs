import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import {PDFDocument,StandardFonts} from 'pdf-lib';
import {createCanvas} from '@napi-rs/canvas';
import {createRequire} from 'node:module';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';
import {createPdfRouter} from '../routes/pdf.js';
import {createSearchableRouter} from '../routes/searchablePdf.routes.js';
import {isolatedOcr} from '../utils/isolatedOcr.js';
import {ocrResources} from '../utils/searchablePdf.js';
import {limits,createBudget,uploadFile,job} from '../utils/resourceProtection.js';
const standardFontDataUrl=path.join(path.dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json')),'standard_fonts')+path.sep;
const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ocr-acceptance-'));
test.after(()=>fs.rm(dir,{recursive:true,force:true}));
async function fixture(kind){
  const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica);
  const canvas=createCanvas(900,250),ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,900,250);ctx.fillStyle='black';ctx.font='48px sans-serif';ctx.fillText('SCANNED LEGAL TEST 123',25,120);
  const scan=await pdf.embedPng(canvas.toBuffer('image/png'));
  if(kind!=='scan'){pdf.addPage([450,200]).drawText('DIGITAL LEGAL TEXT 456',{x:20,y:150,size:20,font});}
  if(kind!=='text'){pdf.addPage([450,200]).drawImage(scan,{x:0,y:0,width:450,height:125});}
  return Buffer.from(await pdf.save());
}
async function extract(buffer){const task=getDocument({data:Uint8Array.from(buffer),isEvalSupported:false,standardFontDataUrl});try{const doc=await task.promise;const text=[];for(let i=1;i<=doc.numPages;i++)text.push((await(await doc.getPage(i)).getTextContent()).items.map(x=>x.str).join(' '));return text.join('\n');}finally{await task.destroy();}}
async function serve(run){const app=express();app.use(createPdfRouter());app.use(createSearchableRouter());const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));try{await run('http://127.0.0.1:'+server.address().port);}finally{await new Promise(r=>server.close(r));}}
async function post(url,bytes){const body=new FormData();body.append('file',new Blob([bytes],{type:'application/pdf'}),'synthetic.pdf');for(let attempt=0;attempt<20;attempt++){const response=await fetch(url,{method:'POST',body});if(response.status!==503)return response;await response.arrayBuffer();await new Promise(r=>setTimeout(r,20));}throw Error('Capacity did not recover');}
test('real local resources initialize English Hindi and Marathi',async()=>{assert.deepEqual((await ocrResources()).languages,['eng','hin','mar']);});
for(const kind of ['scan','text','mixed'])test('real HTTP OCR and searchable PDF: '+kind,async()=>{
  const input=await fixture(kind);
  await serve(async base=>{
    const response=await post(base+'/upload-pdf',input);assert.equal(response.status,200,await response.clone().text());const {text}=await response.json();
    if(kind!=='scan')assert.match(text,/DIGITAL LEGAL TEXT 456/);
    if(kind!=='text')assert.match(text,/SCANNED LEGAL TEST 123/);
    const pdfResponse=await post(base+'/pdf-to-searchable-pdf',input);assert.equal(pdfResponse.status,200,await pdfResponse.clone().text());assert.equal(pdfResponse.headers.get('cache-control'),'no-store');
    const output=Buffer.from(await pdfResponse.arrayBuffer());const searchable=(await extract(output)).replace(/\s+/g,' ');
    if(kind!=='scan')assert.match(searchable,/DIGITAL LEGAL TEXT 456/);
    if(kind!=='text')assert.match(searchable,/SCANNED LEGAL TEST 123/);
    assert.equal((await PDFDocument.load(output)).getPageCount(),kind==='mixed'?2:1);
  });
});
test('real child cancellation kills work and cleans output',async()=>{
  const input=path.join(dir,'cancel.pdf');await fs.writeFile(input,await fixture('scan'));const c=new AbortController();c.abort();await assert.rejects(isolatedOcr(input,{signal:c.signal},()=>assert.fail()),/cancelled|timed out/);
});
test('memory guard kills child and returns a clear split-document error',async()=>{
  const input=path.join(dir,'memory.pdf');await fs.writeFile(input,await fixture('scan'));
  const old=process.env.OCR_PROCESS_BUDGET_MB;process.env.OCR_PROCESS_BUDGET_MB='1';
  try{await assert.rejects(isolatedOcr(input,{},()=>assert.fail()),error=>error.status===413&&/memory budget/.test(error.message));}
  finally{if(old===undefined)delete process.env.OCR_PROCESS_BUDGET_MB;else process.env.OCR_PROCESS_BUDGET_MB=old;}
});

test('real Hindi Marathi scan produces Unicode searchable text',async()=>{
  const image=path.join(dir,'devanagari.png');await fs.copyFile(new URL('./fixtures/ocr-devanagari.png',import.meta.url),image);
  await isolatedOcr(image,{image:true},async(output)=>{const text=await extract(await fs.readFile(output));assert.match(text,/\u092d\u093e\u0930\u0924/);assert.match(text,/\u092e\u0930\u093e\u0920\u0940/);});
});
test('hard child deadline rejects and kills a running job',async()=>{
  const input=path.join(dir,'deadline.pdf');await fs.writeFile(input,await fixture('scan'));
  const old=limits.timeout;limits.timeout=1;
  try{await assert.rejects(isolatedOcr(input,{},()=>assert.fail()),error=>error.status===504);}
  finally{limits.timeout=old;}
});
test('same-page native text and scanned image are retained without duplicate native OCR',async()=>{
  const source=await PDFDocument.load(await fixture('mixed')),pdf=await PDFDocument.create();
  const embedded=await pdf.embedPage(source.getPage(1)),font=await pdf.embedFont(StandardFonts.Helvetica);
  const page=pdf.addPage([450,200]);page.drawPage(embedded);page.drawText('DIGITAL LEGAL TEXT 456',{x:20,y:150,size:20,font});
  const input=path.join(dir,'same-page.pdf');await fs.writeFile(input,await pdf.save());
  await isolatedOcr(input,{},async output=>{const text=(await extract(await fs.readFile(output))).replace(/\s+/g,' ');assert.match(text,/SCANNED LEGAL TEST 123/);assert.equal(text.match(/DIGITAL LEGAL TEXT 456/g)?.length,1);});
});
