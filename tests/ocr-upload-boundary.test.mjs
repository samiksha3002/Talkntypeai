// Keep the 100+ MiB synthetic HTTP client buffers in a separate test process.
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs/promises';
import {limits,createBudget,uploadFile,job} from '../utils/resourceProtection.js';
async function post(url,bytes){const body=new FormData();body.append('file',new Blob([bytes],{type:'application/pdf'}),'synthetic.pdf');return fetch(url,{method:'POST',body});}
test('50 MiB file accepted at upload boundary; one byte over rejected before processing',async()=>{
  assert.equal(limits.pdfUpload,50*1024*1024);assert.equal(limits.searchable,limits.pdfUpload);
  // Test transport independently, without allocating the PDF parser's working set.
  const app=express();let calls=0;app.post('/',...createBudget({concurrency:1}),uploadFile('file','pdf',limits.pdfUpload),job(async(req,res)=>{calls++;await fs.unlink(req.file.path);res.json({size:req.file.size});}));
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  try{const url='http://127.0.0.1:'+server.address().port+'/';let response=await post(url,Buffer.alloc(limits.pdfUpload));assert.equal(response.status,200);assert.equal((await response.json()).size,limits.pdfUpload);response=await post(url,Buffer.alloc(limits.pdfUpload+1));assert.equal(response.status,413);assert.equal(calls,1);}finally{await new Promise(r=>server.close(r));}
});

