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
      assert.equal((await fetch(base + '/')).status, 404, 'old GET /api/deepgram that returned the key is gone');
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
  const steno = fs.readFileSync(new URL('../src/components/Sidebar/Stenocard.jsx', import.meta.url), 'utf8');
  assert.match(steno, /createClient\(\{ accessToken \}\)/);
});
