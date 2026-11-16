import {ocrResources,localWorker} from '../utils/searchablePdf.js';
import fs from 'node:fs/promises';
import {createCanvas} from '@napi-rs/canvas';
const resources=await ocrResources();
const worker=await localWorker();
try {
  const canvas=createCanvas(600,120),ctx=canvas.getContext('2d');
  ctx.fillStyle='white';ctx.fillRect(0,0,600,120);ctx.fillStyle='black';ctx.font='40px sans-serif';ctx.fillText('OCR CHECK 123',20,70);
  const {data}=await worker.recognize(canvas.toBuffer('image/png'));
  if(!/OCR CHECK 123/.test(data.text))throw Error('OCR smoke recognition failed');
  const image=await fs.readFile(new URL('../tests/fixtures/ocr-devanagari.png',import.meta.url));
  const result=await worker.recognize(image);
  if(!result.data.text.includes('\u092d\u093e\u0930\u0924') || !result.data.text.includes('\u092e\u0930\u093e\u0920\u0940'))throw Error('Hindi/Marathi OCR smoke recognition failed');
  console.log(JSON.stringify({engine:'tesseract.js local',languages:resources.languages,recognition:{eng:'passed',hin:'passed',mar:'passed'}}));
}finally{await worker.terminate();}
