import multer from 'multer';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createWriteStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import { PDFDocument } from 'pdf-lib';
import { createCanvas, loadImage } from '@napi-rs/canvas';

export function setting(name, fallback) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`Invalid ${name}`);
  return value;
}
export const limits = {
  upload: setting('DOCUMENT_UPLOAD_MB', 100) * 1024 * 1024,
  searchable: setting('SEARCHABLE_UPLOAD_MB', 25) * 1024 * 1024,
  pages: setting('DOCUMENT_MAX_PAGES', 500),
  pixels: setting('DOCUMENT_MAX_IMAGE_PIXELS', 40000000),
  rasterPixels: setting('DOCUMENT_MAX_RASTER_PIXELS', 2000000000),
  timeout: setting('DOCUMENT_TIMEOUT_MS', 600000),
};
export const resourceError = (status, message) => Object.assign(new Error(message), { status, resourceProtection:true });
export function sendResourceError(res, error) {
  if (!res.headersSent && !res.destroyed) res.status(error.resourceProtection ? error.status : 500).json({success:false,error:error.resourceProtection ? error.message : 'Document processing failed. Please retry.'});
}

// Bound simultaneous JSON/form buffering before Express parses the bodies.
export function createBodyBudget(max=setting('BODY_CONCURRENCY',4),timeout=setting('BODY_TIMEOUT_MS',120000)){
  let active=0;
  return (req,res,next)=>{
    if(!req.is('application/json')&&!req.is('application/x-www-form-urlencoded'))return next();
    if(active>=max)return res.status(503).json({success:false,error:'Request capacity is busy. Retry shortly.'});
    active++;let released=false;
    const release=()=>{if(!released){released=true;active--;clearTimeout(timer);}};
    const timer=setTimeout(()=>{sendResourceError(res,resourceError(408,'Request body timed out.'));req.destroy();release();},timeout);
    timer.unref();req.once('end',release);req.once('aborted',release);res.once('close',release);next();
  };
}

// No queue: reject excess work before reading uploads. A timed-out job retains
// its slot until it actually settles; Promise.race must never free CPU capacity.
export function createBudget({concurrency = 2, timeout = limits.timeout, rate = 30} = {}) {
  let active = 0;
  const limiter = rateLimit({windowMs:60000, limit:rate, standardHeaders:true, legacyHeaders:false,
    message:{success:false,error:'Processing request limit exceeded. Retry shortly.'}});
  function admit(req, res, next) {
    if (active >= concurrency) {res.set('Retry-After','5');return res.status(503).json({success:false,error:'Document processing capacity is busy. Retry shortly.'});}
    active++;
    const controller = new AbortController(); let released = false, running = false;
    const release = () => {if (!released) {released=true;active--;clearTimeout(timer);res.off('close',close);}};
    const close = () => {if (!res.writableFinished) controller.abort();if (!running) release();};
    const timer = setTimeout(() => {
      controller.abort();
      if(req.resource?.uploading)res.once('finish',()=>{req.destroy();release();});
      sendResourceError(res,resourceError(504,'Processing timed out. Retry with a smaller document.'));
      if (!running) release();
    },timeout);
    timer.unref(); res.on('close',close);res.once('finish',()=>{if (!running) release();});
    req.once('aborted',()=>controller.abort());
    req.resource = {signal:controller.signal, begin(){running=true;},release}; next();
  }
  return [limiter, admit];
}
export const documentBudget = createBudget({concurrency:setting('DOCUMENT_CONCURRENCY',2)});
export const aiBudget = createBudget({concurrency:setting('AI_CONCURRENCY',8),timeout:setting('AI_TIMEOUT_MS',180000),rate:setting('AI_REQUESTS_PER_MINUTE',60)});
export const job = handler => async (req,res) => {
  req.resource?.begin();
  try {req.resource?.signal.throwIfAborted();await handler(req,res);}
  catch(error){sendResourceError(res,error);}
  finally{req.resource?.release();}
};
const temporaryStorage={
  async _handleFile(req,file,callback){
    const filename=randomUUID(),filePath=path.join(os.tmpdir(),filename);
    const output=createWriteStream(filePath,{flags:'wx',mode:0o600});
    try{await pipeline(file.stream,output,{signal:req.resource?.signal});callback(null,{destination:os.tmpdir(),filename,path:filePath,size:output.bytesWritten});}
    catch(error){await fs.unlink(filePath).catch(()=>{});callback(error);}
  },
  async _removeFile(req,file,callback){await fs.unlink(file.path).catch(()=>{});callback(null);},
};
export function uploadFile(field, kind, maxBytes = limits.upload) {
  const allowed = {pdf:['application/pdf','application/octet-stream'],image:['image/png','image/jpeg','image/webp','image/gif'],csv:['text/csv','application/csv','application/vnd.ms-excel','application/octet-stream']}[kind];
  const upload = multer({storage:temporaryStorage,limits:{fileSize:maxBytes,files:1,fields:20,fieldSize:1024*1024,parts:21},
    fileFilter(req,file,cb){cb(allowed.includes(file.mimetype) ? null : resourceError(415,'Unsupported file type.'),allowed.includes(file.mimetype));}}).single(field);
  return (req,res,next)=>{req.resource?.begin();if(req.resource)req.resource.uploading=true;upload(req,res,async error=>{
    if(req.resource)req.resource.uploading=false;
    if(error){if(req.file)await fs.unlink(req.file.path).catch(()=>{});sendResourceError(res,resourceError(error.code==='LIMIT_FILE_SIZE'?413:error.status||400,error.code==='LIMIT_FILE_SIZE'?'Upload exceeds the configured size limit.':error.status?error.message:'Invalid multipart upload.'));req.resource?.release();return;}
    if(req.resource?.signal.aborted){if(req.file)await fs.unlink(req.file.path).catch(()=>{});req.resource.release();return;}
    if(!req.file){sendResourceError(res,resourceError(400,'No file uploaded.'));req.resource?.release();return;}
    // Multer owns cleanup on partial uploads; after completion our finalizer owns it.
    res.once('close',()=>{if(!req.resource?.processing)fs.unlink(req.file.path).catch(()=>{});});
    next();
  });};
}
export async function withFile(req, handler) {
  req.resource && (req.resource.processing=true);
  try {return await handler(req.file.path);}
  finally {await fs.unlink(req.file.path).catch(()=>{});}
}
export async function inspectPdf(bytes) {
  if(!Buffer.from(bytes).subarray(0,5).equals(Buffer.from('%PDF-')))throw resourceError(415,'Invalid PDF content.');
  let pdf;try{pdf=await PDFDocument.load(bytes);}catch{throw resourceError(422,'Unreadable or encrypted PDF.');}
  if(!pdf.getPageCount() || pdf.getPageCount()>limits.pages)throw resourceError(413,'PDF exceeds the configured page limit.');
  let total=0;
  for(const page of pdf.getPages()){
    const {width,height}=page.getCropBox();const pixels=Math.ceil(width*200/72)*Math.ceil(height*200/72);
    if(!Number.isFinite(pixels)||width<=0||height<=0||pixels>limits.pixels)throw resourceError(413,'PDF page dimensions exceed the configured limit.');
    total+=pixels;
  }
  if(total>limits.rasterPixels)throw resourceError(413,'PDF rasterization budget exceeded.');
  return pdf;
}
export async function inspectImage(bytes) {
  const b=Buffer.from(bytes);let width,height,mime;
  if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&b.length>=24){width=b.readUInt32BE(16);height=b.readUInt32BE(20);mime='image/png';}
  else if(/^GIF8[79]a$/.test(b.subarray(0,6).toString('ascii'))&&b.length>=10){width=b.readUInt16LE(6);height=b.readUInt16LE(8);mime='image/gif';}
  else if(b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP'&&b.length>=30){
    mime='image/webp';const type=b.subarray(12,16).toString();
    if(type==='VP8X'){width=1+b.readUIntLE(24,3);height=1+b.readUIntLE(27,3);}
    else if(type==='VP8 '&&b[23]===0x9d&&b[24]===1&&b[25]===0x2a){width=b.readUInt16LE(26)&0x3fff;height=b.readUInt16LE(28)&0x3fff;}
    else if(type==='VP8L'&&b[20]===0x2f){const bits=b.readUInt32LE(21);width=(bits&0x3fff)+1;height=((bits>>>14)&0x3fff)+1;}
  }
  else if(b[0]===255&&b[1]===216){
    mime='image/jpeg';let offset=2;
    while(offset+9<b.length){if(b[offset++]!==255)continue;const marker=b[offset++];if(marker===216||marker===217)continue;const len=b.readUInt16BE(offset);if(len<2)break;
      if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){height=b.readUInt16BE(offset+3);width=b.readUInt16BE(offset+5);break;}offset+=len;}
  }
  if(!width||!height)throw resourceError(415,'Only valid PNG, JPEG, WebP and GIF images are supported.');
  if(width*height>limits.pixels)throw resourceError(413,'Image dimensions exceed the configured pixel limit.');
  // Decode only after dimensions have been bounded; reject damaged image data.
  try{const image=await loadImage(b);const canvas=createCanvas(1,1);canvas.getContext('2d').drawImage(image,0,0,1,1);}catch{throw resourceError(422,'Unreadable image.');}
  return {width,height,mime};
}

export function inspectAudio(bytes) {
  const b=Buffer.from(bytes), ascii=(start,end)=>b.subarray(start,end).toString('ascii');
  const valid=(ascii(0,4)==='RIFF'&&ascii(8,12)==='WAVE')||ascii(0,4)==='OggS'||ascii(0,4)==='fLaC'||ascii(0,3)==='ID3'||ascii(4,8)==='ftyp'||b.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]))||(b[0]===255&&(b[1]&0xe0)===0xe0);
  if(!valid)throw resourceError(415,'Unsupported or invalid audio content.');
}
