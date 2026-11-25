// Proxy from the browser to the Python "TNT_BRAIN" service.
//
// Browsers call /api/brain/<endpoint> on this API (JWT + active subscription +
// per-user limits are enforced by the API guard before this router). The request
// is streamed to BRAIN_URL/api/<endpoint> with:
//   X-Brain-Secret: BRAIN_SHARED_SECRET   (Python refuses requests without it)
//   X-User-Id:      the verified user id   (Python keeps documents per user)
// The browser's Authorization header, cookies and any client-supplied
// X-User-Id are never forwarded. Mounted BEFORE the body parsers so multipart
// uploads and server-sent events stream through unchanged.
import express from 'express';
import { once } from 'node:events';
import { setting } from '../utils/resourceProtection.js';

export const BRAIN_ENDPOINTS = new Set(['generate-legal-draft-stream', 'generate-legal-draft', 'analyze-document',
  'chat-with-pdf', 'ai-command', 'legal-research', 'translate-research-marathi']);
const FORWARD_RESPONSE_HEADERS = ['content-type', 'x-accel-buffering'];

export function brainConfig(env = process.env) {
  const url = (env.BRAIN_URL || '').replace(/\/+$/, '');
  const secret = env.BRAIN_SHARED_SECRET || '';
  return {
    url: /^https?:\/\//.test(url) ? url : '',
    secret: secret.length >= 32 ? secret : '',
    maxBytes: setting('BRAIN_MAX_UPLOAD_MB', 51) * 1024 * 1024,
    timeoutMs: setting('BRAIN_TIMEOUT_MS', 300000),
  };
}

const tooLarge = () => Object.assign(new Error('Request too large'), { tooLarge: true });
async function* limited(stream, maxBytes) {
  let total = 0;
  for await (const chunk of stream) {
    total += chunk.length;
    if (total > maxBytes) throw tooLarge();
    yield chunk;
  }
}

export function createBrainRouter({ fetcher = fetch, config = brainConfig } = {}) {
  const router = express.Router();
  router.post('/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    if (!BRAIN_ENDPOINTS.has(endpoint)) return res.status(404).json({ error: 'Not found.' });
    const { url, secret, maxBytes, timeoutMs } = config();
    if (!url || typeof secret !== 'string' || secret.length < 32) {
      console.error('[brain] BRAIN_URL / BRAIN_SHARED_SECRET (>= 32 chars) are not configured.');
      return res.status(503).json({ error: 'The AI drafting service is not configured.' });
    }
    if (!req.user?.id) return res.status(401).json({ error: 'Sign in to continue.' });
    const contentType = req.headers['content-type'];
    if (!/^(application\/json|multipart\/form-data)/i.test(contentType || '')) {
      return res.status(415).json({ error: 'Use JSON or multipart form data.' });
    }
    const declared = Number(req.headers['content-length']);
    if (Number.isFinite(declared) && declared > maxBytes) return res.status(413).json({ error: 'Upload exceeds the size limit.' });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    timer.unref();
    const onClose = () => { if (!res.writableFinished) controller.abort(); };
    res.on('close', onClose);
    try {
      const upstream = await fetcher(`${url}/api/${endpoint}`, {
        method: 'POST', duplex: 'half', signal: controller.signal,
        headers: { 'Content-Type': contentType, Accept: req.headers.accept || '*/*', 'X-Brain-Secret': secret, 'X-User-Id': req.user.id },
        body: limited(req, maxBytes),
      });
      if (upstream.status === 401 || upstream.status === 503) {
        console.error('[brain] upstream refused the proxy (status ' + upstream.status + '); check BRAIN_SHARED_SECRET on both services.');
        await upstream.body?.cancel?.().catch(() => {});
        return res.status(502).json({ error: 'The AI drafting service is unavailable. Please try again shortly.' });
      }
      res.status(upstream.status);
      for (const name of FORWARD_RESPONSE_HEADERS) { const value = upstream.headers.get(name); if (value) res.setHeader(name, value); }
      res.setHeader('Cache-Control', 'no-store');
      if (!upstream.body) return res.end();
      res.flushHeaders();
      for await (const chunk of upstream.body) {
        if (!res.write(chunk)) await once(res, 'drain');
      }
      res.end();
    } catch (error) {
      if (res.headersSent) { res.destroy(); return; }
      if (error?.tooLarge || error?.cause?.tooLarge) return res.status(413).json({ error: 'Upload exceeds the size limit.' });
      if (controller.signal.aborted && !res.writableEnded && !res.destroyed) return res.status(504).json({ error: 'The AI drafting service timed out.' });
      console.error('[brain] proxy error:', error?.message);
      if (!res.destroyed) res.status(502).json({ error: 'The AI drafting service is unavailable. Please try again shortly.' });
    } finally {
      clearTimeout(timer);
      res.off('close', onClose);
    }
  });
  return router;
}

export default createBrainRouter();
