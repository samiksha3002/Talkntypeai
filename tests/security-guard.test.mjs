import { testJwt } from './fixtures/jwt.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import express from 'express';
import { createAuth, tokenHash } from '../middleware/auth.js';
import { createApiGuard, createUserLimiters, isPaid, loginLimiter } from '../middleware/apiGuard.js';
import { isOwnApi, installApiAuth, attachAxiosAuth } from '../src/apiAuth.js';

const ids = { active: '0000000000000000000000a1', expired: '0000000000000000000000a2', pending: '0000000000000000000000a3', admin: '0000000000000000000000a4', other: '0000000000000000000000a5' };
const accounts = {
  [ids.active]: { _id: ids.active, role: 'user', subscription: { isActive: true, expiryDate: new Date(Date.now() + 864e5) } },
  [ids.expired]: { _id: ids.expired, role: 'user', subscription: { isActive: true, expiryDate: new Date(Date.now() - 864e5) } },
  [ids.pending]: { _id: ids.pending, role: 'user', subscription: { isActive: false } },
  [ids.admin]: { _id: ids.admin, role: 'admin', subscription: { isActive: false } },
  [ids.other]: { _id: ids.other, role: 'user', subscription: { isActive: true } },
};
const jtiOf = id => id.slice(-2).repeat(32);
const sessions = { async findOne(q) { const owner = Object.keys(accounts).find(id => tokenHash(jtiOf(id)) === q.tokenHash); return owner ? { ownerId: owner, tokenHash: q.tokenHash } : null; } };
const auth = createAuth({ sessions, users: { findById: async id => accounts[id] || null }, access: 'subscription' });
const bearer = id => ({ Authorization: 'Bearer ' + testJwt(id, jtiOf(id)) });

async function serve(guard, run) {
  const app = express();
  app.use('/api', guard);
  app.use((req, res) => res.json({ reached: true, user: req.user?.id || null }));
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  try { await run('http://127.0.0.1:' + server.address().port); } finally { await new Promise(r => server.close(r)); }
}

// Every route prefix mounted in server.js.
const serverSource = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const mounts = [...new Set([...serverSource.matchAll(/app\.use\(\s*"(\/api[^"]*)"/g)].map(m => m[1]))];

test('guard: every mounted /api route rejects anonymous requests except the explicit public ones', async () => {
  assert.ok(mounts.length >= 25, 'expected to find the server.js mounts');
  await serve(createApiGuard({ auth, limiters: createUserLimiters({ perMinute: 1000, paidPerMinute: 1000 }) }), async base => {
    const probe = ['/api/judgements/search?q=x', '/api/chat', '/api/audio/transcribe', '/api/deepgram', '/api/ocr/image-to-text', '/api/upload-pdf',
      '/api/generate-legal-draft', '/api/list-models', '/api/legal-ai/search', '/api/draft/generate-draft', '/api/judgement-ai/headnote',
      '/api/chattranslate', '/api/transliterate', '/api/expand', '/api/fix-grammar', '/api/cases/user/x', '/api/clients/user/x',
      '/api/inquiries', '/api/payments', '/api/reports', '/api/team', '/api/csv-manager/list/x', '/api/dictionary/define/x', '/api/font/supported',
      '/API/CHAT', '/api/Judgements/search', '/api/login/', '/api/unknown-route',
      ...mounts.filter(m => !['/api', '/api/admin', '/api/user-drafts', '/api/saved', '/api/draft-session', '/api/drafts'].includes(m)).map(m => m + '/probe')];
    for (const path of probe) for (const method of ['GET', 'POST']) {
      const res = await fetch(base + path, { method });
      assert.equal(res.status, 401, `${method} ${path} must require authentication`);
    }
    for (const [method, path] of [['POST', '/api/login'], ['POST', '/api/create-user'], ['POST', '/api/draft-session'], ['GET', '/api/drafts/all'], ['GET', '/api/drafts/0123']]) {
      const res = await fetch(base + path, { method });
      assert.equal(res.status, 200, `${method} ${path} must stay public`);
    }
    // Routers with their own (tested) authentication are passed through to them.
    for (const path of ['/api/admin/users', '/api/user-drafts', '/api/saved']) assert.equal((await fetch(base + path)).status, 200);
  });
});

test('guard: subscription is checked on the server for paid endpoints', async () => {
  await serve(createApiGuard({ auth, limiters: createUserLimiters({ perMinute: 1000, paidPerMinute: 1000 }) }), async base => {
    const call = id => fetch(base + '/api/chat', { method: 'POST', headers: bearer(id) });
    assert.equal((await call(ids.active)).status, 200);
    assert.equal((await (await call(ids.active)).json()).user, ids.active);
    assert.equal((await call(ids.admin)).status, 200);
    assert.equal((await call(ids.expired)).status, 403);
    assert.equal((await call(ids.pending)).status, 403);
    const forged = testJwt(ids.active, jtiOf(ids.active)).slice(0, -2) + 'AA';
    assert.equal((await fetch(base + '/api/chat', { method: 'POST', headers: { Authorization: 'Bearer ' + forged } })).status, 401);
  });
});

test('guard: per-user limits apply to paid routes, separately for each user', async () => {
  await serve(createApiGuard({ auth, limiters: createUserLimiters({ perMinute: 6, paidPerMinute: 2 }) }), async base => {
    const paid = id => fetch(base + '/api/judgements/search?q=x', { headers: bearer(id) }).then(r => r.status);
    assert.deepEqual([await paid(ids.active), await paid(ids.active), await paid(ids.active)], [200, 200, 429]);
    assert.equal(await paid(ids.other), 200, 'another user is not affected');
    assert.equal(await fetch(base + '/API/JUDGEMENTS/search?q=x', { headers: bearer(ids.active) }).then(r => r.status), 429, 'case variants share the paid limit');
    const general = () => fetch(base + '/api/cases/user/x', { headers: bearer(ids.active) }).then(r => r.status);
    const statuses = []; for (let i = 0; i < 4; i++) statuses.push(await general());
    assert.ok(statuses.includes(429), 'overall per-user limit applies to all authenticated routes');
  });
  assert.ok(isPaid('/api/judgements/search') && isPaid('/api/deepgram') && !isPaid('/api/drafts/all') && !isPaid('/api/chattranslatex'));
});

test('login limiter blocks repeated failures per IP but not successful sign-ins', async () => {
  const app = express(); app.use(express.json());
  app.post('/login', loginLimiter, (req, res) => res.status(req.body.ok ? 200 : 401).json({}));
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  const url = 'http://127.0.0.1:' + server.address().port + '/login';
  const post = ok => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok }) }).then(r => r.status);
  try {
    for (let i = 0; i < 5; i++) assert.equal(await post(true), 200);
    const failures = []; for (let i = 0; i < 11; i++) failures.push(await post(false));
    assert.equal(failures.filter(s => s === 401).length, 10); assert.equal(failures.at(-1), 429);
  } finally { await new Promise(r => server.close(r)); }
});

test('frontend: the JWT is attached only to our own API, never to other hosts', async () => {
  const pageOrigin = 'https://talkntype.pro';
  assert.ok(isOwnApi('https://talkntypeai.onrender.com/api/chat', { pageOrigin }));
  assert.ok(isOwnApi('/api/judgements/search', { pageOrigin }));
  assert.ok(isOwnApi('http://localhost:5000/api/x', { pageOrigin }));
  for (const url of ['https://talkntype-ai-python.onrender.com/api/legal-research', 'https://api.deepgram.com/v1/listen', 'https://api.dictionaryapi.dev/api/v2/x',
    'https://talkntypeai.onrender.com/health', 'https://evil.example/api/chat', 'javascript:alert(1)'])
    assert.equal(isOwnApi(url, { pageOrigin }), false, url);

  const seen = [];
  const target = { location: { origin: pageOrigin }, fetch: async (input, init) => { seen.push([String(input), new Headers(init?.headers).get('Authorization')]); return {}; } };
  const savedLocation = globalThis.location; globalThis.location = target.location;
  try {
    installApiAuth({ token: () => 'jwt-value', target, http: { interceptors: { request: { use() {} } } } });
    await target.fetch('https://talkntypeai.onrender.com/api/chat', { method: 'POST' });
    await target.fetch('https://api.deepgram.com/v1/listen');
    await target.fetch('/api/x', { headers: { Authorization: 'Bearer explicit' } });
    assert.deepEqual(seen, [['https://talkntypeai.onrender.com/api/chat', 'Bearer jwt-value'], ['https://api.deepgram.com/v1/listen', null], ['/api/x', 'Bearer explicit']]);

    let interceptor; attachAxiosAuth({ interceptors: { request: { use(fn) { interceptor = fn; } } } }, { token: () => 'jwt-value' });
    assert.equal(interceptor({ url: 'https://talkntypeai.onrender.com/api/expand', headers: {} }).headers.Authorization, 'Bearer jwt-value');
    assert.equal(interceptor({ baseURL: 'https://talkntypeai.onrender.com/api', url: '/judgements/search', headers: {} }).headers.Authorization, 'Bearer jwt-value');
    assert.equal(interceptor({ url: 'https://api.dictionaryapi.dev/api/v2/entries/en/x', headers: {} }).headers.Authorization, undefined);
  } finally { globalThis.location = savedLocation; }
});
