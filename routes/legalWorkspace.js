import express from 'express';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { requireDraftAuth } from '../middleware/draftAuth.js';
import { createBudget, job, resourceError } from '../utils/resourceProtection.js';
const actions = new Set(['analyze-document','chat-with-pdf','generate-legal-draft-stream','ai-command']);
export function createLegalWorkspaceRouter({ auth = requireDraftAuth, fetcher = fetch, config = () => ({ url: process.env.LEGAL_AI_SERVICE_URL, key: process.env.LEGAL_AI_SERVICE_KEY }) } = {}) {
  const router = express.Router();
  const budget = createBudget({ concurrency: 1, timeout: 600000, rate: 12 });
  router.use(auth);
  router.post('/:action', (req,res,next) => actions.has(req.params.action) ? next() : res.sendStatus(404), ...budget,
    express.json({ limit:'64kb' }), express.raw({ type: 'multipart/form-data', limit: '11mb' }), job(async (req,res) => {
      const { url, key } = config();
      if (!key || key.length < 32 || !url) throw resourceError(503,'Secure AI service is not configured.');
      const target = new URL(url);
      if (target.username || target.password || target.search || target.hash || !['','/'].includes(target.pathname) ||
        (target.protocol !== 'https:' && !(target.protocol === 'http:' && ['127.0.0.1','localhost'].includes(target.hostname)))) throw resourceError(503,'Secure AI service is not configured.');
      const type = req.get('content-type') || '';
      if (!type.startsWith('application/json') && !type.startsWith('multipart/form-data;')) throw resourceError(415,'Use JSON or multipart form data.');
      const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
      if (body.length > 11*1024*1024) throw resourceError(413,'Request is too large.');
      const upstream = await fetcher(target.origin + '/internal/legal-workspace/' + req.params.action, {
        method:'POST', redirect:'error', signal:req.resource.signal, body,
        headers:{'Content-Type':type,'X-Legal-Service-Key':key,'X-Legal-Owner':String(req.draftOwnerId)}
      });
      res.status(upstream.status).set({'Cache-Control':'no-store','Content-Type':upstream.headers.get('content-type') || 'application/json','X-Accel-Buffering':'no'});
      if (!upstream.ok) {
        await upstream.body?.cancel();
        return res.type('json').json({detail: upstream.status < 500 ? 'Check your PDF or request and retry.' : 'AI service unavailable. Retry shortly.'});
      }
      if (!upstream.body) throw resourceError(502,'Empty AI response.');
      await pipeline(Readable.fromWeb(upstream.body),res,{signal:req.resource.signal});
    }));
  // The raw parser runs after admission; release capacity if it rejects a body.
  router.use((error,req,res,next)=>{req.resource?.release();next(error);});
  return router;
}
export default createLegalWorkspaceRouter();
