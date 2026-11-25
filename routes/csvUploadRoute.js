import express from 'express';
import fs from 'node:fs';
import csv from 'csv-parser';
import CsvCaseModel from '../models/CsvCaseModel.js';
import {documentBudget,uploadFile,withFile,job,setting,resourceError} from '../utils/resourceProtection.js';
import { ownerOf } from '../utils/ownership.js';
// Rows are owned by the signed-in user (req.user from the verified JWT); any
// userId in the form body or URL is ignored.
export function createCsvRouter(repository=CsvCaseModel){
const router=express.Router();
router.post('/import',...documentBudget,uploadFile('file','csv'),job(async(req,res)=>{
  const userId=ownerOf(req);
  await withFile(req,async path=>{
    const input=fs.createReadStream(path);const parser=csv({maxRowBytes:1024*1024,mapHeaders:({header})=>header.replace(/^\uFEFF/,'').trim().toLowerCase()});
    input.on('error',error=>parser.destroy(error));input.pipe(parser);
    const abort=()=>parser.destroy(resourceError(408,'CSV import cancelled.'));
    req.resource.signal.addEventListener('abort',abort,{once:true});
    const results=[];
    try{
      for await(const data of parser){
        if(results.length>=setting('CSV_MAX_ROWS',50000))throw resourceError(413,'CSV row limit exceeded.');
        if(Object.values(data).some(value=>String(value).includes('\0')))throw resourceError(415,'Invalid CSV content.');
        results.push({userId,serialNo:data.id||data.serialno,lastDate:data.lastdate||data['last date'],courtName:data.court||data.courtname,caseNumber:data.matterno||data['matter no']||data.casenumber,petitioner:data['first party']||data.petitioner||data.firstparty,respondent:data['second party']||data.respondent||data.secondparty,nextDate:data['next date']||data.nextdate||''});
      }
      if(!results.length||!results.some(row=>row.caseNumber||row.petitioner||row.courtName))throw resourceError(400,'CSV file is empty or headers mismatch.');
      req.resource.signal.throwIfAborted();
      await repository.insertMany(results,{ordered:false});
      if(!req.resource.signal.aborted)res.json({success:true,message:results.length+' cases imported successfully!'});
    }finally{req.resource.signal.removeEventListener('abort',abort);input.destroy();parser.destroy();}
  });
}));
router.get("/list/:userId", async (req, res) => {
  try {
    const cases = await repository.find({ userId: ownerOf(req) });
    res.json(cases);
  } catch (error) {
    if (error?.status === 401) return res.status(401).json({ error: "Sign in to continue." });
    res.status(500).json({ error: "Failed to fetch cases" });
  }
});

return router;
}
export default createCsvRouter();