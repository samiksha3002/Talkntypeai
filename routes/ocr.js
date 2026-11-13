import express from 'express';
import fs from 'node:fs/promises';
import OpenAI from 'openai';
import { documentBudget, uploadFile, withFile, job, inspectImage, limits } from '../utils/resourceProtection.js';
export function createOcrRouter(generate=async(bytes,mime,signal)=>{
  const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:limits.timeout,maxRetries:0});
  const response=await client.chat.completions.create({model:'gpt-4o-mini',messages:[{role:'user',content:[{type:'text',text:"\r\n    Extract text from this image exactly as it appears.\r\n    \r\n    STRICT RULES:\r\n    1. **Do NOT start with** phrases like \"Here is the extracted text\" or \"Based on the image\". Just give the text directly.\r\n    2. **Preserve Structure:** Keep new lines, lists, and gaps exactly as seen in the image.\r\n    3. **Layout:** If there is a large gap between words (like a form), keep that gap.\r\n    4. **Tables:** If there is a table, format it using Markdown pipe tables (| Col1 | Col2 |).\r\n    \r\n    Output ONLY the raw content.\r\n  "},{type:'image_url',image_url:{url:'data:'+mime+';base64,'+bytes.toString('base64')}}]}]},{signal});
  return response.choices[0]?.message?.content||'';
}){
  const router=express.Router();
  router.post('/image-to-text',...documentBudget,uploadFile('image','image'),job(async(req,res)=>{
    const text=await withFile(req,async path=>{const bytes=await fs.readFile(path);const {mime}=await inspectImage(bytes);req.resource.signal.throwIfAborted();return generate(bytes,mime,req.resource.signal);});
    if(!req.resource.signal.aborted)res.json({success:true,text});
  }));return router;
}
export default createOcrRouter();
