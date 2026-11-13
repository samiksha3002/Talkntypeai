import { PDFDocument, StandardFonts, degrees } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createWorker } from 'tesseract.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const fontPath=path.join(path.dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json')),'standard_fonts')+path.sep;
import { inspectImage, inspectPdf, limits, resourceError } from './resourceProtection.js';

export function ocrWords(data) {
  if(data && data.blocks===null && !data.text?.trim())return [];
  if (!Array.isArray(data?.blocks)) throw resourceError(502,'OCR did not return word geometry.');
  return data.blocks.flatMap(block=>(block.paragraphs||[]).flatMap(p=>(p.lines||[]).flatMap(l=>l.words||[])));
}
export async function localWorker() {
  const langPath=process.env.OCR_LANG_PATH;
  if(!langPath)throw resourceError(503,'Local OCR language resources are not configured.');
  const gzip=!process.env.OCR_UNCOMPRESSED;
  await fs.access(path.join(langPath,gzip?'eng.traineddata.gz':'eng.traineddata'));
  return createWorker('eng',1,{langPath,gzip,cacheMethod:'none'});
}
function untilAborted(promise,signal){
  if(!signal)return promise;
  return new Promise((resolve,reject)=>{
    const abort=()=>reject(resourceError(504,'OCR processing was cancelled or timed out.'));
    signal.addEventListener('abort',abort,{once:true});
    if(signal.aborted)abort();
    Promise.resolve(promise).then(resolve,reject).finally(()=>signal.removeEventListener('abort',abort));
  });
}
export async function searchablePdf(bytes,{image=false,workerFactory=localWorker,signal}={}) {
  const source=image?null:await inspectPdf(bytes);
  const output=source?await PDFDocument.load(bytes):await PDFDocument.create();
  const font=await output.embedFont(StandardFonts.Helvetica);
  let worker, loading, raster, wordsTotal=0;
  const terminate=()=>{worker?.terminate().catch(()=>{});loading?.destroy().catch(()=>{});};
  signal?.throwIfAborted();signal?.addEventListener('abort',terminate,{once:true});
  try {
    worker=await workerFactory();signal?.throwIfAborted();
    if(source){loading=getDocument({data:Uint8Array.from(bytes),standardFontDataUrl:fontPath,isEvalSupported:false,useSystemFonts:false,disableFontFace:true});raster=await loading.promise;}
    for(let index=0;index<(source?source.getPageCount():1);index++){
      signal?.throwIfAborted();let png,viewport,page;
      if(source){
        const scan=await raster.getPage(index+1);viewport=scan.getViewport({scale:200/72});
        if(viewport.width*viewport.height>limits.pixels)throw resourceError(413,'PDF page dimensions exceed the configured limit.');
        const target=raster.canvasFactory.create(Math.ceil(viewport.width),Math.ceil(viewport.height));
        try{await scan.render({canvasContext:target.context,viewport}).promise;png=target.canvas.toBuffer('image/png');}finally{raster.canvasFactory.destroy(target);scan.cleanup();}
        page=output.getPage(index);
      }else{
        const size=await inspectImage(bytes);png=bytes;
        if(!['image/png','image/jpeg'].includes(size.mime)){
          const decoded=await loadImage(bytes),canvas=createCanvas(size.width,size.height);
          canvas.getContext('2d').drawImage(decoded,0,0);png=canvas.toBuffer('image/png');
        }
        const embedded=size.mime==='image/jpeg'?await output.embedJpg(bytes):await output.embedPng(png);
        page=output.addPage([size.width*72/200,size.height*72/200]);page.drawImage(embedded,{x:0,y:0,width:page.getWidth(),height:page.getHeight()});
        viewport={width:size.width,height:size.height,rotation:0,convertToPdfPoint:(x,y)=>[x*72/200,(size.height-y)*72/200]};
      }
      const {data}=await untilAborted(worker.recognize(png,{}, {text:true,blocks:true}),signal);
      signal?.throwIfAborted();const words=ocrWords(data);
      if(data.text?.trim()&&!words.length)throw resourceError(502,'OCR text has no usable word geometry.');
      for(const word of words){
        const text=word.text?.trim();if(!text)continue;
        const {x0,y0,x1,y1}=word.bbox||{};
        if(![x0,y0,x1,y1].every(Number.isFinite)||x1<=x0||y1<=y0||x0<0||y0<0||x1>viewport.width+1||y1>viewport.height+1)throw resourceError(502,'OCR returned invalid word geometry.');
        try{font.encodeText(text);}catch{throw resourceError(422,'OCR text requires an unsupported PDF font. No partial PDF was returned.');}
        const [x,y]=viewport.convertToPdfPoint(x0,y1);
        const height=(y1-y0)*72/200,width=(x1-x0)*72/200;
        const size=Math.min(height*.85,width/font.widthOfTextAtSize(text,1));
        page.drawText(text,{x,y,size,font,rotate:degrees(viewport.rotation),opacity:0});wordsTotal++;
      }
    }
    signal?.throwIfAborted();return {buffer:Buffer.from(await output.save()),words:wordsTotal};
  }finally{signal?.removeEventListener('abort',terminate);await worker?.terminate().catch(()=>{});await loading?.destroy().catch(()=>{});}
}
