import './fixtures/jwt.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import express from 'express';
import { createBrainRouter, BRAIN_ENDPOINTS } from '../routes/brain.js';

const SECRET = 'test-only-brain-shared-secret-0123456789';
const USER = '0000000000000000000000aa';

// Fake Python service: records what it receives, can stream SSE.
async function fakeBrain(handler, run) {
  const seen = [];
  const server = http.createServer(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c);
    const record = { path: req.url, headers: req.headers, body: Buffer.concat(chunks) }; seen.push(record);
    await handler(record, res);
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  try { await run('http://127.0.0.1:' + server.address().port, seen); } finally { await new Promise(r => server.close(r)); }
}
const once = (emitter, event) => new Promise(r => emitter.once(event, r));
async function proxy(brainUrl, run, { maxMb = 1, user = USER, secret = SECRET } = {}) {
  const app = express();
  app.use((req, res, next) => { if (user) req.user = { id: user }; next(); });   // set by the API guard in production
  app.use('/api/brain', createBrainRouter({ config: () => ({ url: brainUrl, secret, maxBytes: maxMb * 1024 * 1024, timeoutMs: 5000 }) }));
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  try { await run('http://127.0.0.1:' + server.address().port + '/api/brain'); } finally { await new Promise(r => server.close(r)); }
}
const json = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };

test('proxy forwards the shared secret and the VERIFIED user id; never the browser token or a spoofed user', async () => {
  await fakeBrain((r, res) => json(res, 200, { ok: true }), async (brain, seen) => {
    await proxy(brain, async base => {
      const res = await fetch(base + '/chat-with-pdf', { method: 'POST', body: JSON.stringify({ query: 'q' }),
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer user-jwt', 'X-User-Id': 'ffffffffffffffffffffffff', 'X-Brain-Secret': 'guess', Cookie: 'a=b' } });
      assert.equal(res.status, 200); assert.deepEqual(await res.json(), { ok: true });
    });
    assert.equal(seen.length, 1);
    assert.equal(seen[0].path, '/api/chat-with-pdf');
    assert.equal(seen[0].headers['x-brain-secret'], SECRET);
    assert.equal(seen[0].headers['x-user-id'], USER);
    assert.equal(seen[0].headers.authorization, undefined);
    assert.equal(seen[0].headers.cookie, undefined);
    assert.deepEqual(JSON.parse(seen[0].body), { query: 'q' });
  });
});

test('proxy only exposes the known AI endpoints', async () => {
  await fakeBrain((r, res) => json(res, 200, {}), async (brain, seen) => {
    await proxy(brain, async base => {
      for (const path of ['/login', '/register', '/health', '/..%2Fhealth', '/anything'])
        assert.equal((await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 404, path);
      for (const endpoint of BRAIN_ENDPOINTS)
        assert.equal((await fetch(base + '/' + endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 200, endpoint);
    });
    assert.equal(seen.length, BRAIN_ENDPOINTS.size);
  });
});

test('multipart PDF uploads pass through byte-for-byte; oversize uploads are refused', async () => {
  await fakeBrain((r, res) => json(res, 200, { bytes: r.body.length }), async (brain, seen) => {
    await proxy(brain, async base => {
      const pdf = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(200000, 7)]);
      const form = new FormData(); form.append('file', new Blob([pdf], { type: 'application/pdf' }), 'case.pdf');
      const res = await fetch(base + '/analyze-document', { method: 'POST', body: form });
      assert.equal(res.status, 200);
      assert.ok(seen[0].headers['content-type'].startsWith('multipart/form-data; boundary='));
      assert.ok(seen[0].body.includes(pdf));
      const big = new FormData(); big.append('file', new Blob([Buffer.alloc(2 * 1024 * 1024)]), 'big.pdf');
      assert.equal((await fetch(base + '/analyze-document', { method: 'POST', body: big })).status, 413);
      assert.equal((await fetch(base + '/chat-with-pdf', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'x' })).status, 415);
    });
  });
});

test('server-sent draft streams are relayed incrementally', async () => {
  await fakeBrain(async (r, res) => {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'x-accel-buffering': 'no' });
    res.write('data: first\n\n'); await new Promise(r2 => setTimeout(r2, 150)); res.end('data: [DONE]\n\n');
  }, async brain => {
    await proxy(brain, async base => {
      const res = await fetch(base + '/generate-legal-draft-stream', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"facts":"x"}' });
      assert.equal(res.headers.get('content-type'), 'text/event-stream');
      const reader = res.body.getReader(); const decoder = new TextDecoder();
      const first = decoder.decode((await reader.read()).value);
      assert.match(first, /data: first/); assert.doesNotMatch(first, /DONE/, 'first event arrives before the stream ends');
      let rest = ''; for (let r = await reader.read(); !r.done; r = await reader.read()) rest += decoder.decode(r.value);
      assert.match(rest, /\[DONE\]/);
    });
  });
});

test('fails safely: missing config 503, unauthenticated 401, upstream refusal or outage 502', async () => {
  await proxy('', async base => assert.equal((await fetch(base + '/ai-command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 503));
  await proxy('http://127.0.0.1:9', async base => assert.equal((await fetch(base + '/ai-command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 503), { secret: 'short' });
  await fakeBrain((r, res) => json(res, 200, {}), async (brain, seen) => {
    await proxy(brain, async base => assert.equal((await fetch(base + '/ai-command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401), { user: null });
    assert.equal(seen.length, 0);
  });
  await fakeBrain((r, res) => json(res, 401, { detail: 'Unauthorized.' }), async brain => {
    await proxy(brain, async base => {
      const res = await fetch(base + '/ai-command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      assert.equal(res.status, 502);
    });
  });
  await proxy('http://127.0.0.1:9', async base => assert.equal((await fetch(base + '/ai-command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 502));
});

test('server.js mounts the proxy after the auth guard and before any body parser', () => {
  const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  const guard = source.indexOf('createApiGuard()'), brain = source.indexOf('"/api/brain", brainRouter'), json = source.indexOf('express.json(');
  assert.ok(guard > 0 && brain > guard && json > brain);
});

test('frontend AI components call the Node proxy, never the Python service directly', () => {
  for (const file of ['src/Features/Components/AIDrafting.jsx', 'src/Features/Components/ChatWithPDF.jsx', 'src/Features/Components/LegalResearch.jsx', 'src/apiConfig.js'].filter(f => fs.existsSync(f))) {
    const text = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /talkntype-ai-python\.onrender\.com|localhost:8000/, file);
  }
});
