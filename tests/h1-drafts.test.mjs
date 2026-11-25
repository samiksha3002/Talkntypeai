import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createUserDraftRouter } from '../routes/userDrafts.js';
import templateRouter from '../routes/draft.ready.js';
import DraftTemplate from '../models/DraftTemplate.js';
import { createDraftAuth, tokenHash } from '../middleware/draftAuth.js';
import { sanitizeDraftHtml } from '../utils/draftHtml.js';
import { createDraftClient, resolveDraftApi, DraftSaver, storeDraftSession, getDraftSession, readDraftSession, SESSION_KEY, SESSION_STORAGE_MESSAGE } from '../src/Features/LegalHubMain/draftClient.js';
const A = '000000000000000000000001', B = '000000000000000000000002', T = '000000000000000000000003';
const hindi = '\u0928\u094d\u092f\u093e\u092f\u093e\u0932\u092f \u092e\u0947\u0902 \u0939\u093f\u0902\u0926\u0940 \u0906\u0935\u0947\u0926\u0928';
const marathi = '\u092e\u0930\u093e\u0920\u0940 \u0905\u0930\u094d\u091c \u0906\u0923\u093f \u0928\u094d\u092f\u093e\u092f\u093e\u0932\u092f';
const text = '<h2 style="text-align:center">' + hindi + '</h2><p><strong>' + marathi + '</strong> <em>' + hindi + '</em></p><ol><li>' + marathi + '</li></ol>';
const input = (extra = {}) => ({ title: 'Application', category: 'Civil', content: text, templateId: T, operationId: 'creation-operation-0001', ...extra });
function memory() {
  const rows = [];
  let serial = 10;
  const matches = (d, q) => Object.entries(q).every(([k,v]) => String(d[k]) === String(v));
  const drafts = {
    async findOne(q) { return rows.find(d => matches(d,q)) || null; },
    async create(d) { const row = { ...d, _id: String(serial++).padStart(24,'0'), updatedAt: new Date() }; rows.push(row); return row; },
    async findOneAndUpdate(q, update) { const d = rows.find(d => matches(d,q)); if (!d) return null; Object.assign(d, update.$set); d.revision += update.$inc.revision; return d; },
    find(q) { let skip = 0, limit = 21; const chain = { select(){return chain},sort(){return chain},skip(n){skip=n;return chain},limit(n){limit=n;return chain},async lean(){return rows.filter(d=>matches(d,q)).slice(skip,skip+limit)} }; return chain; },
  };
  const router = createUserDraftRouter({ drafts, templates: { exists: async q => q._id === T }, auth: (req,res,next)=>next() });
  return { rows, router };
}
async function call(router, method, path, body, owner=A, params={}) {
  const route=router.stack.find(l=>l.route?.path===path && l.route.methods[method]);
  assert.ok(route,method+' '+path);
  const res={statusCode:200,status(n){this.statusCode=n;return this},json(body){this.body=JSON.parse(JSON.stringify(body));return this}};
  await route.route.stack[0].handle({body,params,query:{},draftOwnerId:owner},res);
  return res;
}
test('create, reopen and update preserve Unicode and HTML, leave templates separate', async()=>{
  const {router,rows}=memory();
  const created=await call(router,'post','/',input());
  assert.equal(created.statusCode,201);const d=created.body.data;
  assert.equal(d.content,text); assert.equal(d.revision,1);assert.equal(rows[0].ownerId,A);
  const loaded=await call(router,'get','/:id',null,A,{id:d._id});assert.deepEqual(loaded.body.data,d);
  const update=await call(router,'patch','/:id',{title:'Edited',category:'Civil',content:text+'<p>\u0928\u0935\u0940\u0928</p>',revision:1,operationId:'update-operation-00001'},A,{id:d._id});
  assert.equal(update.body.data._id,d._id);assert.equal(update.body.data.revision,2);assert.equal(update.body.data.templateId,T);assert.ok(update.body.data.content.includes('\u0928\u0935\u0940\u0928'));assert.equal(rows.length,1);
});
test('two-user isolation: list, read and update',async()=>{
  const {router}=memory();const d=(await call(router,'post','/',input())).body.data;
  assert.equal((await call(router,'get','/:id',null,B,{id:d._id})).statusCode,404);
  assert.equal((await call(router,'patch','/:id',{title:'Stolen',content:text,revision:1,operationId:'update-operation-00001'},B,{id:d._id})).statusCode,404);
  assert.deepEqual((await call(router,'get','/',null,B)).body.data,[]);
  assert.equal((await call(router,'get','/',null,A)).body.data.length,1);
});
test('reject client ownership, invalid templates, HTML emptiness and oversized content',async()=>{
  const {router}=memory();
  for(const body of [input({ownerId:B}),input({userId:B}),input({content:'<p><br></p>'}),input({content:'x'.repeat(1024*1024+1)}),input({templateId:'bad'})]) assert.equal((await call(router,'post','/',body)).statusCode,400);
  assert.equal((await call(router,'post','/',input({templateId:B}))).statusCode,404);
});
test('duplicate creates are idempotent, different payload with same key conflicts',async()=>{
  const {router,rows}=memory();const first=await call(router,'post','/',input());const again=await call(router,'post','/',input());
  assert.equal(again.body.data._id,first.body.data._id);assert.equal(rows.length,1);
  assert.equal((await call(router,'post','/',input({content:'<p>different</p>'}))).statusCode,409);
});
test('stale updates conflict; uncertain successful updates replay once',async()=>{
  const {router}=memory();const d=(await call(router,'post','/',input())).body.data;
  const body={title:'Updated',content:text,revision:1,operationId:'update-operation-00001'};
  assert.equal((await call(router,'patch','/:id',body,A,{id:d._id})).body.data.revision,2);
  assert.equal((await call(router,'patch','/:id',body,A,{id:d._id})).body.data.revision,2);
  assert.equal((await call(router,'patch','/:id',{...body,operationId:'different-operation-01'},A,{id:d._id})).statusCode,409);
});
test('database errors return failure without success payload',async()=>{
  const router=createUserDraftRouter({drafts:{findOne:async()=>{throw Error('private database detail')}},auth:(req,res,next)=>next()});
  const res=await call(router,'post','/',input());assert.equal(res.statusCode,503);assert.equal(res.body.success,false);assert.ok(!JSON.stringify(res.body).includes('private'));
});
test('authentication rejects missing/invalid/expired/revoked token and disabled account',async()=>{
  const response=()=>({status(n){this.code=n;return this},json(v){this.body=v;return this}});
  for(const header of [undefined,'Bearer forged']){const res=response();await createDraftAuth()({headers:{authorization:header}},res,()=>assert.fail('unauthorized'));assert.equal(res.code,401)}
  const token='a'.repeat(64);let queried=false;
  const auth=createDraftAuth({sessions:{findOne:async q=>{assert.equal(q.tokenHash,tokenHash(token));assert.ok(q.expiresAt.$gt instanceof Date);queried=true;return null}},users:{}});
  const res=response();await auth({headers:{authorization:'Bearer '+token}},res,()=>assert.fail('expired'));assert.equal(res.code,401);assert.ok(queried);
  const disabled=createDraftAuth({sessions:{findOne:async()=>({ownerId:A})},users:{findById:async()=>({_id:A,role:'user',subscription:{isActive:false}})}});
  const blocked=response();await disabled({headers:{authorization:'Bearer '+token}},blocked,()=>assert.fail('disabled'));assert.equal(blocked.code,403);
});
test('verified session supplies server owner, regardless of supplied user identity',async()=>{
  const auth=createDraftAuth({sessions:{findOne:async()=>({ownerId:A,tokenHash:'hash'})},users:{findById:async()=>({_id:A,role:'user',subscription:{isActive:true}})}});
  const req={headers:{authorization:'Bearer '+'a'.repeat(64)},body:{ownerId:B}};let called=false;
  await auth(req,{},()=>{called=true});assert.ok(called);assert.equal(req.draftOwnerId,A);
});
test('sanitization retains supported formatting and removes executable HTML/URLs/styles',()=>{
  assert.equal(sanitizeDraftHtml(text),text);
  const safe=sanitizeDraftHtml('<script>alert(1)</script><img src=x onerror=alert(1)><p onclick="x" style="text-align:center;background-image:url(javascript:x)">\u0928\u0935\u0940\u0928</p><a href="javascript:x">link</a>');
  assert.ok(!/<script|<img|onclick|href|javascript|background-image/i.test(safe));assert.ok(safe.includes('<p style="text-align:center">\u0928\u0935\u0940\u0928</p>'));
  assert.ok(!sanitizeDraftHtml('<svg><style><p style="color:red" onmouseover="x">text</p></style></svg>').includes('onmouseover'));
});
test('existing template GET contracts remain compatible',async()=>{
  const originalFind=DraftTemplate.find,originalId=DraftTemplate.findById;
  try {
    DraftTemplate.find=()=>({select:async()=>[{_id:T,title:'Master',category:'Civil'}]});DraftTemplate.findById=async id=>({_id:id,title:'Master',templateBody:'# \u0928\u0935\u0940\u0928'});
    const list=await call(templateRouter,'get','/all');assert.equal(list.body.success,true);assert.equal(list.body.data[0]._id,T);
    const one=await call(templateRouter,'get','/:id',null,A,{id:T});assert.equal(one.body.data.templateBody,'# \u0928\u0935\u0940\u0928');
    assert.deepEqual(templateRouter.stack.filter(l=>l.route).map(l=>Object.keys(l.route.methods)),[['get'],['get']]);
  } finally {DraftTemplate.find=originalFind;DraftTemplate.findById=originalId;}
});
test('client template loading is explicitly Node configured and validates failures',async()=>{
  assert.throws(()=>resolveDraftApi(),/Configure/);assert.equal(resolveDraftApi('http://localhost:5000'),'http://localhost:5000/api');assert.throws(()=>resolveDraftApi('http://example.test'),/HTTPS/);
  const request=createDraftClient({base:'http://localhost:5000',token:()=>null,fetcher:async(url,options)=>{assert.equal(url,'http://localhost:5000/api/drafts/'+T);assert.equal(options.headers.Authorization,undefined);return {ok:true,json:async()=>({success:true,data:{_id:T}})}}});
  assert.equal((await request('/drafts/'+T,{publicRequest:true})).data._id,T);
  await assert.rejects(request('/user-drafts'),/Sign in/);
  for(const response of [{ok:false,status:401,json:async()=>({success:false,error:'Expired'})},{ok:true,json:async()=>({success:false})},{ok:true,json:async()=>{throw Error('html')}}]){
    const r=createDraftClient({base:'http://localhost:5000',token:()=> 'token',fetcher:async()=>response});await assert.rejects(r('/user-drafts'));
  }
  const r=createDraftClient({base:'http://localhost:5000',token:()=> 'token',fetcher:async()=>{throw Error('offline')}});await assert.rejects(r('/user-drafts'),/offline/);
});
test('save coordinator rejects parallel saves and preserves newer edits after uncertain creation',async()=>{
  const {router,rows}=memory();let fail=true;const sent=[];
  const request=async(path,options)=>{sent.push(options.body);const res=await call(router,options.method==='POST'?'post':'patch',options.method==='POST'?'/':'/:id',options.body,A,{id:path.split('/').pop()});if(fail){fail=false;throw Error('response lost')}if(res.statusCode>=400)throw Error(res.body.error);return res.body};
  const saver=new DraftSaver(request);const fields={title:'Application',category:'Civil',content:text,templateId:T};
  await assert.rejects(saver.save(fields),/response lost/);
  const result=await saver.save({...fields,content:text+'<p>new typing</p>'});assert.equal(rows.length,1);assert.equal(result.revision,2);assert.ok(result.content.includes('new typing'));assert.deepEqual(sent[0],sent[1]);
  let release;const pending=new Promise(resolve=>release=resolve);const blocking=new DraftSaver(async()=>{await pending;return {data:{_id:A,templateId:T,title:'Application',content:text,revision:1}}});const first=blocking.save(fields);await assert.rejects(blocking.save(fields),/already/);release();await first;
});
test('malformed persistence confirmation never clears pending save',async()=>{
  const saver=new DraftSaver(async()=>({success:true,data:{}}));await assert.rejects(saver.save({title:'A',content:text,templateId:T}),/not confirmed/);assert.ok(saver.pending);assert.equal(saver.document,null);
});
test('draft sign-in verifies Mongo account, issues session, rejects bypass identities',async()=>{
  const {createDraftSessionRouter}=await import('../routes/draftSession.js');
  let issued=0;
  const router=createDraftSessionRouter({users:{findOne:async q=>q.email==='client@example.test'?{_id:A,password:'fixture-password',role:'user',subscription:{isActive:true}}:null},issue:async owner=>{assert.equal(owner,A);issued++;return {token:'a'.repeat(64),expiresAt:new Date(Date.now()+10000).toISOString()}}});
  const invoke=async body=>{const handler=router.stack.find(l=>l.route).route.stack[0].handle;const res={statusCode:200,status(n){this.statusCode=n;return this},setHeader(){},json(b){this.body=b}};await handler({body},res);return res};
  assert.equal((await invoke({email:'client@example.test',password:'wrong'})).statusCode,401);
  assert.equal((await invoke({email:{'$ne':null},password:'anything'})).statusCode,400);
  assert.equal((await invoke({email:'static@example.test',password:'fixture-password'})).statusCode,401);
  const ok=await invoke({email:'client@example.test',password:'fixture-password'});assert.equal(ok.body.success,true);assert.equal(ok.body.data.token.length,64);assert.equal(issued,1);
});
test('logout revokes the authenticated token only',async()=>{
  let query;
  const router=createUserDraftRouter({sessions:{deleteOne:async q=>{query=q}},auth:(req,res,next)=>next()});
  const handler=router.stack.find(l=>l.route?.path==='/logout').route.stack[0].handle;
  const res={json(b){this.body=b},status(){return this}};
  await handler({headers:{authorization:'Bearer '+'a'.repeat(64)},body:{ownerId:B}},res);assert.deepEqual(query,{tokenHash:tokenHash('a'.repeat(64))});assert.equal(res.body.success,true);
});
test('table spans and paragraph spacing survive canonicalization',()=>{
  const html='<table style="border-collapse:collapse"><tr><td colspan="2" style="text-align:center">\u0928\u0935\u0940\u0928</td></tr></table><p style="margin-bottom:12pt">\u0928\u0935\u0940\u0928</p>';
  assert.equal(sanitizeDraftHtml(html),html);
});
test('SPA recovery remains in memory and is cleared on account/session change',async()=>{
  const {recoveryKey,rememberDraft,recoverDraft,forgetDraft,clearDraftRecovery}=await import('../src/Features/LegalHubMain/draftRecovery.js');
  const k=recoveryKey('test-session-a','/draft/edit/'+A);rememberDraft(k,text);assert.equal(recoverDraft(k),text);assert.equal(recoverDraft(recoveryKey('test-session-b','/draft/edit/'+A)),undefined);forgetDraft(k);assert.equal(recoverDraft(k),undefined);rememberDraft(k,text);clearDraftRecovery();assert.equal(recoverDraft(k),undefined);
});

test('session issuance stores only a hash and enforces a bounded lifetime',async()=>{
  const {default:Session}=await import('../models/DraftSession.js');const {issueDraftSession}=await import('../middleware/draftAuth.js');const original=Session.create;let row;
  try {Session.create=async value=>{row=value};const result=await issueDraftSession(A);assert.match(result.token,/^[a-f0-9]{64}$/);assert.equal(row.tokenHash,tokenHash(result.token));assert.equal(row.token,undefined);assert.equal(String(row.ownerId),A);assert.ok(new Date(result.expiresAt).getTime()>Date.now());assert.ok(new Date(result.expiresAt).getTime()<=Date.now()+12*3600000);}finally{Session.create=original}
});
test('model declares atomic idempotency index and strict ownership fields',async()=>{
  const {default:Draft}=await import('../models/UserDraft.js');assert.equal(Draft.schema.options.strict,'throw');assert.ok(Draft.schema.path('ownerId').isRequired);assert.ok(Draft.schema.indexes().some(([fields,opts])=>fields.ownerId===1&&fields.creationKey===1&&opts.unique));
});
test('concurrent creation duplicate-key response recovers the original document',async()=>{
  const {router:original,rows}=memory();const d=(await call(original,'post','/',input())).body.data;let reads=0;
  const router=createUserDraftRouter({drafts:{findOne:async()=>++reads===1?null:rows[0],create:async()=>{const e=new Error('duplicate');e.code=11000;throw e}},templates:{exists:async()=>true},auth:(req,res,next)=>next()});
  const response=await call(router,'post','/',input());assert.equal(response.statusCode,201);assert.equal(response.body.data._id,d._id);
});
test('recovery retains uncertain save identity across SPA navigation',async()=>{
  const {rememberDraft,recoverSaver,clearDraftRecovery}=await import('../src/Features/LegalHubMain/draftRecovery.js');const saver=new DraftSaver(async()=>{throw Error('offline')});await assert.rejects(saver.save({title:'A',content:text,templateId:T}));rememberDraft('fixture',text,saver);assert.equal(recoverSaver('fixture').pending.body.operationId,saver.pending.body.operationId);clearDraftRecovery();
});

test('save confirmation rejects changed identity and unexpected revision',async()=>{
  for(const data of [{_id:B,templateId:T,title:'A',content:text,revision:2},{_id:A,templateId:T,title:'A',content:text,revision:4}]){
    const saver=new DraftSaver(async()=>({success:true,data}),{_id:A,templateId:T,title:'Original',category:'',content:text,revision:1});await assert.rejects(saver.save({title:'Changed',content:text,templateId:T}),/not confirmed/);assert.ok(saver.pending);assert.equal(saver.document.revision,1);
  }
});


test('quoted fonts remain stable across repeated sanitizer and storage cycles', async () => {
  const {router} = memory();
  for (const font of ["'Times New Roman', serif", '&quot;Times New Roman&quot;, serif', '&#39;Noto Sans Devanagari&#39;, sans-serif', '&#x22;Arial&#x22;, sans-serif']) {
    let html = '<p style="font-family:' + font + ';text-align:center"><strong>' + hindi + '</strong> ' + marathi + '</p>';
    const canonical = sanitizeDraftHtml(html);
    assert.ok(canonical.includes('font-family:'), font);
    for (let i = 0; i < 5; i++) {
      html = sanitizeDraftHtml(html);
      assert.equal(html, canonical);
      assert.ok(html.includes(hindi)); assert.ok(html.includes(marathi));
    }
    const created = await call(router, 'post', '/', input({content:html, operationId:crypto.randomUUID()}));
    assert.equal(created.statusCode, 201);
    const id = created.body.data._id;
    for (let revision = 1; revision <= 3; revision++) {
      const reopened = await call(router, 'get', '/:id', null, A, {id});
      assert.equal(reopened.body.data.content, canonical);
      const updated = await call(router, 'patch', '/:id', {title:'Application',category:'Civil',content:sanitizeDraftHtml(reopened.body.data.content),revision,operationId:crypto.randomUUID()}, A, {id});
      assert.equal(updated.statusCode, 200);assert.equal(updated.body.data.content, canonical);
    }
  }
});
test('quote decoding cannot introduce CSS execution or HTML attributes', () => {
  const attacks = [
    'font-family:&quot;Arial&quot; onmouseover=&quot;alert(1)&quot;',
    'font-family:expression(alert(1))',
    'font-family:url(javascript:alert(1))',
    'font-family:&quot;Arial&#59;background-image:url(javascript:x)&quot;',
    'font-family:&#x27;Arial&#x27;);color:expression(alert(1))',
    'constructor:abc;__proto__:abc;background-image:url(https://example.test/pixel)',
  ];
  for (const style of attacks) {
    let html = '<p style="' + style + '">' + hindi + marathi + '</p>';
    for (let i=0;i<3;i++) html=sanitizeDraftHtml(html);
    assert.ok(!/onmouseover|javascript|expression|url\(|background-image|constructor|__proto__/i.test(html),html);
    assert.ok(html.includes(hindi)); assert.ok(html.includes(marathi));
  }
});
test('Unicode fixtures detect corruption and preserve exact Hindi/Marathi after save and reopen', async () => {
  const expectedHindi = String.fromCodePoint(0x928,0x94d,0x92f,0x93e,0x92f,0x93e,0x932,0x92f,0x20,0x92e,0x947,0x902,0x20,0x939,0x93f,0x902,0x926,0x940,0x20,0x906,0x935,0x947,0x926,0x928);
  const expectedMarathi = String.fromCodePoint(0x92e,0x930,0x93e,0x920,0x940,0x20,0x905,0x930,0x94d,0x91c,0x20,0x906,0x923,0x93f,0x20,0x928,0x94d,0x92f,0x93e,0x92f,0x93e,0x932,0x92f);
  assert.equal(hindi,expectedHindi);assert.equal(marathi,expectedMarathi);
  const check = html => { assert.ok(html.includes(expectedHindi)); assert.ok(html.includes(expectedMarathi)); assert.ok(!html.includes('\ufffd')); };
  assert.throws(()=>check(text.replace(/[\u0900-\u097f]/g,'?')));
  const {router}=memory();const saved=await call(router,'post','/',input());
  const reopened=await call(router,'get','/:id',null,A,{id:saved.body.data._id});
  assert.equal(reopened.body.data.content,text);check(reopened.body.data.content);
});
test('session storage get/set/remove exceptions fail closed without breaking local identity storage', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
  const originalLocal = Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  const local = new Map();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{setItem:(k,v)=>local.set(k,v),getItem:k=>local.get(k)}});
  try {
    for (const failure of ['getItem','setItem','removeItem','getter']) {
      const map=new Map([[SESSION_KEY,'a'.repeat(64)]]);
      const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
      Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:storage});
      storeDraftSession(null);
      if(failure==='getter') Object.defineProperty(globalThis,'sessionStorage',{configurable:true,get(){throw Error('blocked')}});
      else storage[failure]=()=>{throw Error('blocked')};
      localStorage.setItem('user','verified-local-display-only');
      assert.doesNotThrow(()=>storeDraftSession(null));
      assert.equal(storeDraftSession({token:'b'.repeat(64)}),false);
      assert.equal(getDraftSession(),null);
      assert.throws(()=>readDraftSession(),e=>e.message===SESSION_STORAGE_MESSAGE);
      let called=false;
      const request=createDraftClient({base:'http://localhost:5000',fetcher:async()=>{called=true;throw Error('unexpected')}});
      await assert.rejects(request('/user-drafts'),e=>e.message===SESSION_STORAGE_MESSAGE);
      assert.equal(called,false);assert.equal(localStorage.getItem('user'),'verified-local-display-only');
    }
    const map=new Map();Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)}});
    assert.equal(storeDraftSession({token:'c'.repeat(64)}),true);assert.equal(readDraftSession(),'c'.repeat(64));
    storeDraftSession(null);
  } finally {
    if(original)Object.defineProperty(globalThis,'sessionStorage',original);else delete globalThis.sessionStorage;
    if(originalLocal)Object.defineProperty(globalThis,'localStorage',originalLocal);else delete globalThis.localStorage;
  }
});
test('logout still clears local draft access when session storage throws', async () => {
  const original=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,get(){throw Error('blocked')}});
  try { const {logoutDraftSession}=await import('../src/Features/LegalHubMain/draftLogout.js');await assert.doesNotReject(logoutDraftSession());assert.equal(getDraftSession(),null); }
  finally {Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{removeItem(){}}});storeDraftSession(null);if(original)Object.defineProperty(globalThis,'sessionStorage',original);else delete globalThis.sessionStorage;}
});
