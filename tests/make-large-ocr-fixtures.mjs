// Generates synthetic large PDF fixtures in a separate process from measurements.
import fs from 'node:fs/promises';
import path from 'node:path';
import {PDFDocument} from 'pdf-lib';
import {createCanvas} from '@napi-rs/canvas';
const dir=process.argv[2];if(!dir)throw Error('Pass output directory');await fs.mkdir(dir,{recursive:true});
for(const mb of [25,50]){
 const pdf=await PDFDocument.create();
 const canvas=createCanvas(1200,350),ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,1200,350);ctx.fillStyle='black';ctx.font='60px sans-serif';ctx.fillText('LARGE SCAN TEST 123',30,170);
 const img=await pdf.embedPng(canvas.toBuffer('image/png'));const page=pdf.addPage([600,175]);page.drawImage(img,{x:0,y:0,width:600,height:175});
 // Opaque uncompressed stream exercises file-size/parser/output memory without
 // pretending this low-page fixture represents a 100-page photographic scan.
 pdf.context.register(pdf.context.stream(new Uint8Array(mb*1024*1024-65536)));
 let bytes=Buffer.from(await pdf.save({useObjectStreams:false}));
 if(bytes.length>mb*1024*1024)throw Error('Fixture larger than target');
 bytes=Buffer.concat([bytes,Buffer.alloc(mb*1024*1024-bytes.length,32)]);
 await fs.writeFile(path.join(dir,mb+'mb.pdf'),bytes,{mode:0o600});
 console.log(mb+' MiB synthetic single scanned page + opaque stream');
}

import {randomFillSync} from 'node:crypto';
{
 const pdf=await PDFDocument.create();
 for(let i=0;i<4;i++){
  const canvas=createCanvas(1800,2300),ctx=canvas.getContext('2d');
  const pixels=ctx.createImageData(1800,2300);randomFillSync(pixels.data);for(let k=3;k<pixels.data.length;k+=4)pixels.data[k]=255;
  ctx.putImageData(pixels,0,0);ctx.fillStyle='white';ctx.fillRect(40,40,1600,200);ctx.fillStyle='black';ctx.font='70px sans-serif';ctx.fillText('NOISY SCAN PAGE '+(i+1),70,160);
  const img=await pdf.embedPng(canvas.toBuffer('image/png'));pdf.addPage([600,767]).drawImage(img,{x:0,y:0,width:600,height:767});
 }
 let bytes=Buffer.from(await pdf.save({useObjectStreams:false}));
 if(bytes.length>50*1024*1024)throw Error('Noisy fixture exceeds target');
 bytes=Buffer.concat([bytes,Buffer.alloc(50*1024*1024-bytes.length,32)]);
 await fs.writeFile(path.join(dir,'50mb-noisy-scan.pdf'),bytes,{mode:0o600});console.log('50 MiB four high-entropy scanned pages');
}
