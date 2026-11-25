import express from 'express';
import fs from 'node:fs/promises';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { documentBudget, uploadFile, withFile, job, inspectPdf, limits } from '../utils/resourceProtection.js';
export function createPdfRouter(generate=async(bytes)=>{
  const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model=genAI.getGenerativeModel({model:'gemini-2.5-pro'}, {timeout:limits.timeout});
  const result=await model.generateContent(['Extract all the text from this PDF. Maintain the layout as much as possible.',{inline_data:{data:bytes.toString('base64'),mime_type:'application/pdf'}}]);
  return result.response.text();
}){
  const router=express.Router();
  router.post('/upload-pdf',...documentBudget,uploadFile('file','pdf'),job(async(req,res)=>{
    const text=await withFile(req,async path=>{const bytes=await fs.readFile(path);await inspectPdf(bytes);req.resource.signal.throwIfAborted();return generate(bytes,req.resource.signal);});
    if(!req.resource.signal.aborted)res.json({success:true,text});
  }));return router;
}
export default createPdfRouter();
