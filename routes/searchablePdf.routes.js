import express from 'express';
import fs from 'node:fs/promises';
import { searchablePdf, ocrResources } from '../utils/searchablePdf.js';
import { documentBudget, uploadFile, withFile, job, limits } from '../utils/resourceProtection.js';
export function createSearchableRouter(convert=searchablePdf) {
  const router=express.Router();
  router.get('/status',async(req,res)=>{
    res.set('Cache-Control','no-store');
    try{const {languages}=await ocrResources();res.json({configured:true,languages,uploadMiB:limits.searchable/1024/1024});}
    catch(error){res.status(503).json({configured:false,error:error.resourceProtection?error.message:'Local OCR resources could not be checked.'});}
  });
  for(const [route,field,image] of [['image-to-searchable-pdf','image',true],['pdf-to-searchable-pdf','file',false]]){
    router.post('/'+route,...documentBudget,uploadFile(field,image?'image':'pdf',limits.searchable),job(async(req,res)=>{
      const result=await withFile(req,async file=>convert(await fs.readFile(file),{image,signal:req.resource.signal}));
      if(req.resource.signal.aborted)return;
      res.set({'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="searchable.pdf"','X-OCR-Word-Count':String(result.words)}).send(result.buffer);
    }));
  }
  return router;
}
export default createSearchableRouter();
