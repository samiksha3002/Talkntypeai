import express from 'express';
import { createHash } from 'node:crypto';
import SavedJudgement from '../models/SavedJudgement.js';
import { requireDraftAuth } from '../middleware/draftAuth.js';
const validId = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value);
export const bookmarkId = (owner,docid) => createHash('sha256').update(String(owner)+':'+docid).digest('hex');
const view = row => Object.fromEntries(['docid','title','citation','court','date','savedAt'].map(key=>[key,row[key]]));
export function createSavedRouter({bookmarks=SavedJudgement,auth=requireDraftAuth}={}) {
  const router=express.Router();
  router.use((req,res,next)=>{res.set('Cache-Control','no-store');next();},auth);
  router.get('/',async(req,res)=>{
    try{const rows=await bookmarks.find({ownerId:req.draftOwnerId}).sort({savedAt:-1,_id:-1}).lean();res.json({saved:rows.map(view)});}
    catch{res.status(503).json({error:'Could not load your bookmarks. Retry shortly.'});}
  });
  router.post('/',async(req,res)=>{
    const body=req.body||{},docid=typeof body.docid==='number'&&Number.isSafeInteger(body.docid)?String(body.docid):body.docid;
    if(!validId(docid))return res.status(400).json({error:'A valid docid is required.'});
    if(['userId','ownerId','_id'].some(key=>Object.hasOwn(body,key)))return res.status(400).json({error:'Bookmark ownership is assigned by your verified session.'});
    const fields={docid};
    for(const [key,max]of Object.entries({title:2000,citation:1000,court:500,date:100})){
      if(body[key]!=null&&(typeof body[key]!=='string'||body[key].length>max))return res.status(400).json({error:'Invalid bookmark metadata.'});
      fields[key]=body[key]||'';
    }
    const filter={_id:bookmarkId(req.draftOwnerId,docid),ownerId:req.draftOwnerId,docid};
    try{
      let row;
      try{row=await bookmarks.findOneAndUpdate(filter,{$setOnInsert:{...fields,ownerId:req.draftOwnerId,savedAt:new Date()}},{upsert:true,new:true,runValidators:true});}
      catch(error){if(error.code!==11000)throw error;row=await bookmarks.findOne(filter);}
      if(!row)throw Error('Bookmark was not confirmed');
      res.status(201).json(view(row));
    }catch{res.status(503).json({error:'Could not save your bookmark. Retry shortly.'});}
  });
  router.delete('/:docid',async(req,res)=>{
    if(!validId(req.params.docid))return res.status(400).json({error:'Invalid docid.'});
    try{
      const result=await bookmarks.deleteOne({ownerId:req.draftOwnerId,docid:req.params.docid});
      if(!result.deletedCount)return res.status(404).json({error:'Not found in your saved list.'});
      res.json({message:'Removed from saved.'});
    }catch{res.status(503).json({error:'Could not remove your bookmark. Retry shortly.'});}
  });
  return router;
}
export default createSavedRouter();
