import { PDFDocument, StandardFonts, degrees, PDFName, PDFHexString, beginText, endText, setFontAndSize, setTextMatrix, showText } from 'pdf-lib';
import { getDocument, Util, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createWorker } from 'tesseract.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import { createRequire } from 'node:module';
const fontPath=path.join(path.dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json')),'standard_fonts')+path.sep;
import { inspectImage, inspectPdf, limits, resourceError } from './resourceProtection.js';

export function ocrWords(data) {
  if(data && data.blocks===null && !data.text?.trim())return [];
  if (!Array.isArray(data?.blocks)) throw resourceError(502,'OCR did not return word geometry.');
  return data.blocks.flatMap(block=>(block.paragraphs||[]).flatMap(p=>(p.lines||[]).flatMap(l=>l.words||[])));
}
export async function ocrResources() {
  const langPath=process.env.OCR_LANG_PATH || fileURLToPath(new URL('../ocr-data',import.meta.url));
  const gzip=process.env.OCR_LANG_PATH ? !process.env.OCR_UNCOMPRESSED : false;
  const languages=[];
  for(const lang of ['eng','hin','mar']) {
    try { await fs.access(path.join(langPath,lang+'.traineddata'+(gzip?'.gz':''))); languages.push(lang); } catch {}
  }
  if(!languages.includes('eng')) throw resourceError(503,'Local OCR English data is missing. Run npm run ocr:provision during build.');
  return {langPath,gzip,languages};
}
export async function localWorker() {
  const {languages,...options}=await ocrResources();
  return createWorker(languages,1,{...options,cacheMethod:'none',errorHandler:()=>{}});
}
// Blank Type3 glyphs carry Unicode for selection/search; original page supplies appearance.
function unicodeWord(pdf,page,text,x,y,width,height,rotation) {
  const ctx=pdf.context;
  const hex=Array.from({length:text.length},(_,i)=>text.charCodeAt(i).toString(16).padStart(4,'0')).join('');
  const cmap=`/CIDInit /ProcSet findresource begin 12 dict begin begincmap
/CIDSystemInfo << /Registry (TNT) /Ordering (Unicode) /Supplement 0 >> def
/CMapName /TNTUnicode def /CMapType 2 def
1 begincodespacerange <00> <FF> endcodespacerange
1 beginbfchar <00> <${hex}> endbfchar endcmap CMapName currentdict /CMap defineresource pop end end`;
  const blank=ctx.register(ctx.flateStream('1000 0 d0\n'));
  const font=ctx.register(ctx.obj({Type:'Font',Subtype:'Type3',FontBBox:[0,0,1000,1000],FontMatrix:[.001,0,0,.001,0,0],CharProcs:ctx.obj({g:blank}),Encoding:ctx.obj({Type:'Encoding',Differences:[0,PDFName.of('g')]}),FirstChar:0,LastChar:0,Widths:[1000],Resources:ctx.obj({}),ToUnicode:ctx.register(ctx.flateStream(cmap))}));
  const key=page.node.newFontDictionary('TNT',font),a=rotation*Math.PI/180;
  page.pushOperators(beginText(),setFontAndSize(key,1),setTextMatrix(width*Math.cos(a),width*Math.sin(a),-height*Math.sin(a),height*Math.cos(a),x,y),showText(PDFHexString.of('00')),endText());
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
export async function searchablePdf(bytes,{image=false,workerFactory=localWorker,signal,textOnly=false}={}) {
  const source=image?null:await inspectPdf(bytes);
  const output=source||await PDFDocument.create();
  const font=await output.embedFont(StandardFonts.Helvetica);
  let worker, loading, raster, wordsTotal=0; const texts=[];
  const terminate=()=>{worker?.terminate().catch(()=>{});loading?.destroy().catch(()=>{});};
  signal?.throwIfAborted();signal?.addEventListener('abort',terminate,{once:true});
  try {
    signal?.throwIfAborted();
    if(source){loading=getDocument({data:Uint8Array.from(bytes),standardFontDataUrl:fontPath,isEvalSupported:false,useSystemFonts:false,disableFontFace:true,stopAtErrors:true});raster=await loading.promise;}
    for(let index=0;index<(source?source.getPageCount():1);index++){
      signal?.throwIfAborted();let png,viewport,page;let existingBoxes=[];
      if(source){
        const scan=await raster.getPage(index+1);
        // Keep existing text on digital and mixed pages; OCR image regions too.
        const nativeItems=(await scan.getTextContent()).items;
        const existing=nativeItems.map(item=>item.str).join(' ');
        if(existing.trim()) texts.push(existing);
        const ops=await scan.getOperatorList();
        const hasImages=ops.fnArray.some(op=>[OPS.paintImageXObject,OPS.paintInlineImageXObject,OPS.paintImageMaskXObject].includes(op));
        if(existing.trim()&&!hasImages){scan.cleanup();continue;}
        viewport=scan.getViewport({scale:200/72});
        existingBoxes=nativeItems.filter(item=>item.str?.trim()).map(item=>{
          const t=Util.transform(viewport.transform,item.transform),h=Math.hypot(t[2],t[3]),w=item.width*viewport.scale;
          return {x0:t[4]-2,y0:t[5]-h-2,x1:t[4]+w+2,y1:t[5]+2};
        });
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
      worker ||= await workerFactory();
      signal?.throwIfAborted();
      const {data}=await untilAborted(worker.recognize(png,{}, {text:true,blocks:true}),signal);
      signal?.throwIfAborted();const words=ocrWords(data); const pageWords=[];
      if(data.text?.trim()&&!words.length)throw resourceError(502,'OCR text has no usable word geometry.');
      for(const word of words){
        const text=word.text?.trim();if(!text)continue;
        const {x0,y0,x1,y1}=word.bbox||{};
        if(![x0,y0,x1,y1].every(Number.isFinite)||x1<=x0||y1<=y0||x0<0||y0<0||x1>viewport.width+1||y1>viewport.height+1)throw resourceError(502,'OCR returned invalid word geometry.');
        const cx=(x0+x1)/2,cy=(y0+y1)/2;
        if(existingBoxes.some(box=>cx>=box.x0&&cx<=box.x1&&cy>=box.y0&&cy<=box.y1))continue;
        pageWords.push(text);
        const [x,y]=viewport.convertToPdfPoint(x0,y1);
        const height=(y1-y0)*72/200,width=(x1-x0)*72/200;
        if(!textOnly){
          try {
            font.encodeText(text);
            const size=Math.min(height*.85,width/font.widthOfTextAtSize(text,1));
            page.drawText(text,{x,y,size,font,rotate:degrees(viewport.rotation),opacity:0});
          } catch { unicodeWord(output,page,text,x,y,width,height,viewport.rotation); }
        }
        wordsTotal++;
      }
      texts.push(existingBoxes.length?pageWords.join(' '):data.text||'');
      if(raster)await raster.cleanup();
    }
    signal?.throwIfAborted();return {buffer:textOnly?undefined:Buffer.from(await output.save()),text:texts.join('\n\n'),words:wordsTotal};
  }finally{signal?.removeEventListener('abort',terminate);await worker?.terminate().catch(()=>{});await loading?.destroy().catch(()=>{});}
}
