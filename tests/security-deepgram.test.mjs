import './fixtures/jwt.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createDeepgramRouter, deepgramGrant, tokenTtlSeconds } from '../routes/deepgram.js';

const SENTINEL_KEY = 'sentinel-deepgram-key-must-never-leave-server';

async function serve(router, run) {
  const app = express(); app.use('/api/deepgram', router);
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  try { await run('http://127.0.0.1:' + server.address().port + '/api/deepgram'); } finally { await new Promise(r => server.close(r)); }
}

test('token endpoint returns only a short-lived token, never the API key', async () => {
  const saved = process.env.DEEPGRAM_API_KEY; process.env.DEEPGRAM_API_KEY = SENTINEL_KEY;
  try {
    let request;
    const fetcher = async (url, init) => { request = { url, init }; return { ok: true, json: async () => ({ access_token: 'temporary-token', expires_in: 60 }) }; };
    await serve(createDeepgramRouter({ grant: options => deepgramGrant({ ...options, fetcher }) }), async base => {
      const res = await fetch(base + '/token', { method: 'POST' });
      const text = await res.text();
      assert.equal(res.status, 200);
      assert.deepEqual(JSON.parse(text), { accessToken: 'temporary-token', expiresIn: 60 });
      assert.ok(!text.includes(SENTINEL_KEY));
      assert.equal(res.headers.get('cache-control'), 'no-store');
      for (const method of ['GET', 'POST']) {   // old key endpoint now refuses everyone (main, C3)
        const old = await fetch(base + '/', { method });
        assert.equal(old.status, 503); assert.ok(!(await old.text()).includes(SENTINEL_KEY));
      }
    });
    assert.equal(request.url, 'https://api.deepgram.com/v1/auth/grant');
    assert.equal(request.init.method, 'POST');
    assert.equal(request.init.headers.Authorization, 'Token ' + SENTINEL_KEY);
    assert.deepEqual(JSON.parse(request.init.body), { ttl_seconds: 60 });
  } finally { if (saved === undefined) delete process.env.DEEPGRAM_API_KEY; else process.env.DEEPGRAM_API_KEY = saved; }
});

test('token endpoint fails safely: missing key 503, upstream errors 502 without details', async () => {
  await serve(createDeepgramRouter({ grant: () => deepgramGrant({ apiKey: '' }) }), async base => {
    const res = await fetch(base + '/token', { method: 'POST' }); assert.equal(res.status, 503);
  });
  await serve(createDeepgramRouter({ grant: () => deepgramGrant({ apiKey: SENTINEL_KEY, fetcher: async () => ({ ok: false, status: 401 }) }) }), async base => {
    const res = await fetch(base + '/token', { method: 'POST' }); const text = await res.text();
    assert.equal(res.status, 502); assert.ok(!text.includes(SENTINEL_KEY)); assert.ok(!text.includes('401'));
  });
  await assert.rejects(deepgramGrant({ apiKey: 'k', fetcher: async () => ({ ok: true, json: async () => ({}) }) }), /no token/);
});

test('token lifetime is configurable but clamped to 30–600 seconds', () => {
  assert.equal(tokenTtlSeconds({}), 60);
  assert.equal(tokenTtlSeconds({ DEEPGRAM_TOKEN_TTL_SECONDS: '5' }), 30);
  assert.equal(tokenTtlSeconds({ DEEPGRAM_TOKEN_TTL_SECONDS: '99999' }), 600);
  assert.equal(tokenTtlSeconds({ DEEPGRAM_TOKEN_TTL_SECONDS: 'abc' }), 60);
});

test('frontend source contains no hard-coded Deepgram key or 40-hex credentials', () => {
  const files = [];
  const walk = dir => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full); else if (/\.(jsx?|mjs|ts|tsx|json)$/.test(entry.name)) files.push(full);
  } };
  walk(new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  assert.ok(files.length > 50);
  const offenders = files.filter(file => /["'`][0-9a-f]{40}["'`]|DEEPGRAM_API_KEY\s*=|createClient\(\s*["'`]/.test(fs.readFileSync(file, 'utf8')));
  assert.deepEqual(offenders, []);
  // Merge note: Stenocard (main) gets its credential from speechCredential.js, which
  // requests a short-lived token from our API when Deepgram is enabled.
  const steno = fs.readFileSync(new URL('../src/components/Sidebar/Stenocard.jsx', import.meta.url), 'utf8');
  assert.match(steno, /await getSpeechCredential\(\)/);
  const credential = fs.readFileSync(new URL('../src/Editor/speechCredential.js', import.meta.url), 'utf8');
  assert.match(credential, /\/api\/deepgram\/token/);
  assert.match(credential, /accessToken/);
});

test('token endpoint is limited per user (default 6 per minute) and keeps the 60 s token lifetime', async () => {
  const { createTokenLimiter } = await import('../routes/deepgram.js');
  const saved = process.env.DEEPGRAM_TOKENS_PER_MINUTE; delete process.env.DEEPGRAM_TOKENS_PER_MINUTE;
  try {
    const app = express();
    app.use((req, res, next) => { req.user = { id: req.headers['x-test-user'] }; next(); });
    app.use('/api/deepgram', createDeepgramRouter({ grant: async () => ({ accessToken: 't', expiresIn: 60 }), limiter: createTokenLimiter() }));
    const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
    const url = 'http://127.0.0.1:' + server.address().port + '/api/deepgram/token';
    const call = user => fetch(url, { method: 'POST', headers: { 'x-test-user': user } }).then(r => r.status);
    try {
      const statuses = []; for (let i = 0; i < 7; i++) statuses.push(await call('0000000000000000000000a1'));
      assert.deepEqual(statuses, [200, 200, 200, 200, 200, 200, 429]);
      assert.equal(await call('0000000000000000000000b2'), 200, 'other users are not affected');
    } finally { await new Promise(r => server.close(r)); }
    process.env.DEEPGRAM_TOKENS_PER_MINUTE = '2';
    const small = express();
    small.use((req, res, next) => { req.user = { id: 'u' }; next(); });
    small.use('/d', createDeepgramRouter({ grant: async () => ({ accessToken: 't', expiresIn: 60 }), limiter: createTokenLimiter() }));
    const s2 = small.listen(0, '127.0.0.1'); await new Promise(r => s2.once('listening', r));
    try {
      const u2 = 'http://127.0.0.1:' + s2.address().port + '/d/token';
      const got = []; for (let i = 0; i < 3; i++) got.push(await fetch(u2, { method: 'POST' }).then(r => r.status));
      assert.deepEqual(got, [200, 200, 429], 'DEEPGRAM_TOKENS_PER_MINUTE is configurable');
    } finally { await new Promise(r => s2.close(r)); }
  } finally { if (saved === undefined) delete process.env.DEEPGRAM_TOKENS_PER_MINUTE; else process.env.DEEPGRAM_TOKENS_PER_MINUTE = saved; }
  assert.equal(tokenTtlSeconds({}), 60);
});

test('speech credential: disabled by default (main), otherwise fetches a short-lived token from our API', async () => {
  const { getSpeechCredential } = await import('../src/Editor/speechCredential.js');
  await assert.rejects(getSpeechCredential(), /security maintenance/);
  const calls = [];
  const fetcher = async (url, init) => { calls.push([url, init.method]); return { ok: true, status: 200, json: async () => ({ accessToken: 'temp', expiresIn: 60 }) }; };
  assert.deepEqual(await getSpeechCredential({ enabled: true, fetcher }), { accessToken: 'temp' });
  assert.match(calls[0][0], /\/api\/deepgram\/token$/); assert.equal(calls[0][1], 'POST');
  for (const [status, message] of [[401, /sign in/i], [403, /subscription/], [429, /wait a minute/]])
    await assert.rejects(getSpeechCredential({ enabled: true, fetcher: async () => ({ ok: false, status, json: async () => ({}) }) }), message);
});
