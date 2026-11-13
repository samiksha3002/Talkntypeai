import { requireDraftAuth } from './draftAuth.js';
export { requireDraftAuth };
export function matchingOwner(req,res,next) {
  const owner=String(req.draftOwnerId);
  const claimed=[req.params.userId,req.body?.userId,req.query.userId].filter(v=>v!==undefined);
  if (req.body?.ownerId!==undefined || claimed.some(v=>typeof v!=='string'||v!==owner)) return res.status(403).json({success:false,error:'Ownership must match your verified account.'});
  res.set('Cache-Control','no-store');next();
}
export function caseFields(body) {
  return Object.fromEntries(['caseName','caseNumber','courtName','hearingDate','description','status'].filter(k=>Object.hasOwn(body,k)).map(k=>[k,body[k]]));
}
