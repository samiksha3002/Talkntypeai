import express from 'express';
import fs from 'node:fs/promises';
import {ocrResources} from '../utils/searchablePdf.js';
import {isolatedOcr} from '../utils/isolatedOcr.js';
import {documentBudget,uploadFile,withFile,job,limits} from '../utils/resourceProtection.js';
export function createSearchableRouter(convert) {
  const router=express.Router();
  router.get('/status',async(req,res)=>{
    res.set('Cache-Control','no-store');
    try {const {languages}=await ocrResources();res.json({configured:true,languages,uploadMB:limits.searchable/1024/1024,maxPages:limits.pages,timeoutMs:limits.timeout});}
    catch {res.status(503).json({configured:false,error:'Local OCR resources are missing. Run the OCR provisioning and smoke check during build.'});}
  });
  for(const [route,field,image] of [['image-to-searchable-pdf','image',true],['pdf-to-searchable-pdf','file',false]]){
    router.post('/'+route,...documentBudget,uploadFile(field,image?'image':'pdf',limits.searchable),job(async(req,res)=>{
      const send=async(file,result)=>{
        if(req.resource.signal.aborted)return;
        res.set({'Cache-Control':'no-store','Content-Type':'application/pdf','Content-Disposition':'attachment; filename="searchable.pdf"','X-OCR-Word-Count':String(result.words)});
        await new Promise((resolve,reject)=>res.sendFile(file,error=>error?reject(error):resolve()));
      };
      await withFile(req,async file=>{
        if(convert){const result=await convert(await fs.readFile(file),{image,signal:req.resource.signal});res.set({'Cache-Control':'no-store','Content-Type':'application/pdf','X-OCR-Word-Count':String(result.words)}).send(result.buffer);}
        else await isolatedOcr(file,{image,signal:req.resource.signal},send);
      });
    }));
  }return router;
}
export default createSearchableRouter();
