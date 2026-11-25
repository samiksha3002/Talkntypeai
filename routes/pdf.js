import express from 'express';
import fs from 'node:fs/promises';
import {isolatedOcr} from '../utils/isolatedOcr.js';
import {documentBudget,uploadFile,withFile,job,inspectPdf} from '../utils/resourceProtection.js';
export function createPdfRouter(generate) {
  const router=express.Router();
  router.post('/upload-pdf',...documentBudget,uploadFile('file','pdf'),job(async(req,res)=>{
    const text=await withFile(req,async file=>{
      if(generate){const bytes=await fs.readFile(file);await inspectPdf(bytes);return generate(bytes,req.resource.signal);}
      return isolatedOcr(file,{textOnly:true,signal:req.resource.signal},output=>fs.readFile(output,'utf8'));
    });
    if(!req.resource.signal.aborted)res.set('Cache-Control','no-store').json({success:true,text});
  }));return router;
}
export default createPdfRouter();
