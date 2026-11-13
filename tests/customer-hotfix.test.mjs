import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeNodeApi, createNodeApiResolver } from '../src/nodeApi.js';
import { findCatalogTemplate } from '../src/Features/LegalHubMain/templateCatalog.js';
const origin = 'https://node.example.test';
test('Node API accepts origin or /api once and refuses credential-bearing or unexpected targets', () => {
  for (const value of [origin, origin+'/', origin+'/api', origin+'/api/']) assert.equal(normalizeNodeApi(value), origin+'/api');
  assert.equal(normalizeNodeApi('/api','http://127.0.0.1:8080'),'http://127.0.0.1:8080/api');
  for (const value of ['http://example.test','https://u:p@node.example.test',origin+'/api/login',origin+'?key=synthetic',origin+'#x']) assert.throws(()=>normalizeNodeApi(value));
});
test('explicit secure API wins; runtime config never overrides it', async () => {
  let calls=0; const resolve=createNodeApiResolver({env:{VITE_DRAFT_API_URL:origin+'/api',VITE_API_URL:'https://other.example.test'},fetcher:()=>{calls++;throw Error('must not load config')}});
  assert.equal(await resolve(),origin+'/api');assert.equal(calls,0);
});
test('missing draft-specific setting uses the general API for every shared client', async () => {
  const resolve=createNodeApiResolver({env:{VITE_API_URL:origin},fetcher:()=>{throw Error('must not load config')}});
  assert.equal(await resolve(),origin+'/api');
});
test('runtime fallback loads once and resolves login/draft/editor to the same API', async () => {
  let calls=0; const resolve=createNodeApiResolver({origin:'https://frontend.example.test',fetcher:async path=>{calls++;assert.equal(path,'/config.json');return{ok:true,json:async()=>({API_URL:origin+'/api/'})}}});
  assert.deepEqual(await Promise.all([resolve(),resolve(),resolve()]),Array(3).fill(origin+'/api'));assert.equal(calls,1);
});
test('missing runtime config falls back to reviewed same-origin /api; invalid explicit config fails closed', async () => {
  assert.equal(await createNodeApiResolver({origin,fetcher:async()=>({ok:false})})(),origin+'/api');
  await assert.rejects(createNodeApiResolver({env:{VITE_DRAFT_API_URL:'invalid',VITE_API_URL:origin}})(),/configuration/);
  await assert.rejects(createNodeApiResolver({origin,fetcher:async()=>({ok:true,json:async()=>({API_URL:'https://u:p@node.example.test'})})})(),/configuration/);
});
test('template matching normalizes whitespace/case but never aliases different legal documents', () => {
  const templates=[{_id:'a'.repeat(24),title:' Regular   Bail Application '},{_id:'b'.repeat(24),title:'Rent Agreement'}];
  assert.equal(findCatalogTemplate(templates,'regular bail application')._id,'a'.repeat(24));
  assert.equal(findCatalogTemplate(templates,'Anticipatory Bail Application'),null);
  assert.equal(findCatalogTemplate([...templates,{...templates[0],_id:'c'.repeat(24)}],'regular bail application'),null);
});
test('checked-in production routing agrees with confirmed Node origin, without provider credentials', () => {
  const env=fs.readFileSync('.env.production','utf8');const config=JSON.parse(fs.readFileSync('public/config.json','utf8'));const vercel=JSON.parse(fs.readFileSync('vercel.json','utf8'));
  assert(env.includes('VITE_API_URL=https://talkntypeai.onrender.com'));assert(env.includes('VITE_DRAFT_API_URL=https://talkntypeai.onrender.com'));
  assert.equal(config.API_URL,'https://talkntypeai.onrender.com');assert.equal(vercel.rewrites[0].destination,config.API_URL+'/api/$1');assert(!/KEY|PASSWORD|SECRET|TOKEN/.test(env));
});
