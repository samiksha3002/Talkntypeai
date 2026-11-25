import {ocrResources,localWorker} from '../utils/searchablePdf.js';
import {createCanvas} from '@napi-rs/canvas';
const resources=await ocrResources();
const worker=await localWorker();
try {
  const canvas=createCanvas(600,120),ctx=canvas.getContext('2d');
  ctx.fillStyle='white';ctx.fillRect(0,0,600,120);ctx.fillStyle='black';ctx.font='40px sans-serif';ctx.fillText('OCR CHECK 123',20,70);
  const {data}=await worker.recognize(canvas.toBuffer('image/png'));
  if(!/OCR CHECK 123/.test(data.text))throw Error('OCR smoke recognition failed');
  console.log(JSON.stringify({engine:'tesseract.js local',languages:resources.languages,recognition:'passed'}));
}finally{await worker.terminate();}
