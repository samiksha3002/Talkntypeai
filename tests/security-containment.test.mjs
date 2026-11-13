import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs';
import {createAdminRouter} from '../routes/admin.js';
import {createDraftAuth,tokenHash} from '../middleware/draftAuth.js';
import {installReleaseContainment,suspendedPrefixes} from '../middleware/releaseContainment.js';
import deepgramRouter from '../routes/deepgram.js';
import authRouter from '../routes/auth.js';
import User from '../models/user.js';
import {getSpeechCredential} from '../src/Editor/speechCredential.js';
async function serve(app,run){const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));try{await run('http://127.0.0.1:'+server.address().port);}finally{await new Promise(r=>server.close(r));}}
const token='a'.repeat(64),normal='b'.repeat(64);const header=t=>({Authorization:'Bearer '+t,'Content-Type':'application/json'});
function fixture(){
 const admin={_id:'1',role:'admin',password:'synthetic-private',email:'admin@example.test'}, user={_id:'2',role:'user',subscription:{isActive:true}};let expired=false,calls=0;
 const auth=createDraftAuth({sessions:{findOne:async q=>expired?null:q.tokenHash===tokenHash(token)?{ownerId:'1'}:q.tokenHash===tokenHash(normal)?{ownerId:'2'}:null},users:{findById:async id=>id==='1'?admin:user}});
 const repo={find:()=>({sort:async()=>{calls++;return[admin]}}),findByIdAndUpdate:async()=>{calls++;return admin},findByIdAndDelete:async()=>{calls++;return admin}};
 const app=express();app.use(express.json());app.use('/api/admin',createAdminRouter({users:repo,auth}));return{app,admin,get calls(){return calls},expire(){expired=true}};
}
test('C1 missing forged normal and expired sessions cannot list or mutate admin data',async()=>{
 const f=fixture();await serve(f.app,async origin=>{
 for(const [headers,status]of [[{},401],[header('c'.repeat(64)),401],[header(normal),403]])for(const [path,method]of [['users','GET'],['update-status/1','PUT'],['update-subscription/1','PUT'],['delete-user/1','DELETE']]){
 const r=await fetch(origin+'/api/admin/'+path,{method,headers,...(method==='PUT'?{body:JSON.stringify({role:'admin',userId:'1',isActive:true})}:{})});assert.equal(r.status,status);}
 assert.equal(f.calls,0);f.expire();assert.equal((await fetch(origin+'/api/admin/users',{headers:header(token)})).status,401);assert.equal(f.calls,0);
 });
});
test('C1 database admin works; C2 list and mutation responses exclude password and unknown private fields',async()=>{
 const f=fixture();f.admin.privateFutureField='not-public';await serve(f.app,async origin=>{
 for(const [path,method]of [['users','GET'],['update-status/1','PUT'],['update-subscription/1','PUT'],['delete-user/1','DELETE']]){
 const r=await fetch(origin+'/api/admin/'+path,{method,headers:header(token),...(method==='PUT'?{body:'{}'}:{})});assert.equal(r.status,200);const text=await r.text();assert(!text.includes('password'));assert(!text.includes('synthetic-private'));assert(!text.includes('privateFutureField'));assert.equal(r.headers.get('cache-control'),'no-store');}
 f.admin.role='user';assert.equal((await fetch(origin+'/api/admin/users',{headers:header(token)})).status,403);
 });
});
test('C3 reserved-email login goes through real account lookup, with no static response',async()=>{
 const original=User.findOne;let queried=false;User.findOne=async()=>{queried=true;return null};
 try{const app=express();app.use(express.json(),authRouter);await serve(app,async origin=>{const r=await fetch(origin+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'admin@talkntype.com',password:'synthetic'})});assert.equal(r.status,404);assert(queried);assert(!(await r.text()).includes('admin-static-id'));});}finally{User.findOne=original;}
});
test('C3 key endpoint refuses all callers and browser credential source always denies before microphone use',async()=>{
 const app=express();app.use('/api/deepgram',deepgramRouter);await serve(app,async origin=>{for(const method of ['GET','POST']){const r=await fetch(origin+'/api/deepgram',{method,headers:header(token)});assert.equal(r.status,503);assert(!Object.hasOwn(await r.json(),'key'));}});
 await assert.rejects(getSpeechCredential(),/security maintenance/);
 const s=fs.readFileSync('src/components/Sidebar/Stenocard.jsx','utf8');assert(!/const DEEPGRAM_API_KEY\s*=/.test(s));assert(s.indexOf('await getSpeechCredential()')<s.indexOf('navigator.mediaDevices.getUserMedia'));
});
test('C4 every actual legacy mount blocks all methods before body parsing or repository handlers',async()=>{
 const app=express();installReleaseContainment(app);let downstream=0;app.use(()=>{downstream++});
 await serve(app,async origin=>{for(const prefix of suspendedPrefixes)for(const method of ['GET','POST','PUT','PATCH','DELETE']){const r=await fetch(origin+prefix.toUpperCase()+'/nested',{method,headers:header(token)});assert.equal(r.status,503);assert.equal(r.headers.get('cache-control'),'no-store');}assert.equal(downstream,0);});
 const server=fs.readFileSync('server.js','utf8');assert(server.indexOf('installReleaseContainment(app)')<server.indexOf('express.json('));
 for(const prefix of ['/api/cases','/api/clients','/api/inquiries','/api/team','/api/payments','/api/reports','/api/csv-manager'])assert(suspendedPrefixes.includes(prefix));
 for(const prefix of ['/api/user-drafts','/api/saved','/api/draft-session','/api/font','/api/ocr'])assert(!suspendedPrefixes.includes(prefix));
});

test('C2 account errors do not disclose exception values in responses or logs',async()=>{
 const original=User.findOne,log=console.error;const entries=[];User.findOne=async()=>{throw Error('synthetic-private-error')};console.error=(...args)=>entries.push(args.join(' '));
 try{const app=express();app.use(express.json(),authRouter);await serve(app,async origin=>{const r=await fetch(origin+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'synthetic@example.test',password:'synthetic'})});assert.equal(r.status,500);assert(!(await r.text()).includes('synthetic-private-error'));assert(!entries.join(' ').includes('synthetic-private-error'));});}finally{User.findOne=original;console.error=log;}
});
