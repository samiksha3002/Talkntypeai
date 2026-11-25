import express from 'express';
import { createHash } from 'node:crypto';
import UserDraft from '../models/UserDraft.js';
import DraftTemplate from '../models/DraftTemplate.js';
import DraftSession from '../models/DraftSession.js';
import { requireDraftAuth, tokenHash } from '../middleware/draftAuth.js';
import { bearerClaims } from '../middleware/auth.js';
import { sanitizeDraftHtml } from '../utils/draftHtml.js';
const id = value => typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);
const key = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{16,100}$/.test(value);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const view = d => ({ _id: String(d._id), templateId: String(d.templateId), title: d.title,
  category: d.category || '', content: d.content, revision: d.revision, updatedAt: d.updatedAt });
function validate(body, creating) {
  const allowed = new Set(['title', 'category', 'content', 'operationId', creating ? 'templateId' : 'revision']);
  if (!body || Object.keys(body).some(k => !allowed.has(k))) throw new Error('Unexpected draft fields.');
  if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200 ||
    typeof body.content !== 'string' || Buffer.byteLength(body.content) > 1024 * 1024 ||
    (body.category !== undefined && (typeof body.category !== 'string' || body.category.length > 200)) || !key(body.operationId)) throw new Error('Invalid draft fields or document exceeds 1 MB.');
  if (creating ? !id(body.templateId) : !Number.isSafeInteger(body.revision) || body.revision < 1) throw new Error('Invalid template or revision.');
  const content = sanitizeDraftHtml(body.content);
  if (!content.replace(/<[^>]*>|&nbsp;|&#160;/g, '').trim()) throw new Error('Document cannot be empty.');
  return { title: body.title.trim(), category: body.category || '', content };
}
export function createUserDraftRouter({ drafts = UserDraft, templates = DraftTemplate, sessions = DraftSession, auth = requireDraftAuth } = {}) {
  const router = express.Router();
  router.use((req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  router.post('/logout', async (req, res) => {
    // A correctly signed token (even if expired) may revoke its own session;
    // deactivated/deleted accounts must still be able to log out.
    let claims = null;
    try { claims = bearerClaims(req, { allowExpired: true }); } catch { claims = null; }
    if (!claims) return res.status(401).json({ success: false, error: 'A draft session is required.' });
    try { await sessions.deleteOne({ tokenHash: tokenHash(claims.jti) }); res.json({ success: true }); }
    catch { res.status(503).json({ success: false, error: 'Could not revoke session.' }); }
  });
  router.use(auth);
  router.get('/', async (req, res) => {
    const page = Number(req.query.page || 0);
    if (!Number.isSafeInteger(page) || page < 0 || page > 100000) return res.status(400).json({ success: false, error: 'Invalid page.' });
    try {
      const data = await drafts.find({ ownerId: req.draftOwnerId }).select('_id title category revision updatedAt').sort({ updatedAt: -1, _id: -1 }).skip(page * 20).limit(21).lean();
      res.json({ success: true, data: data.slice(0, 20), hasMore: data.length > 20 });
    } catch { res.status(503).json({ success: false, error: 'Could not load your drafts.' }); }
  });
  router.get('/:id', async (req, res) => {
    if (!id(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid draft ID.' });
    try {
      const draft = await drafts.findOne({ _id: req.params.id, ownerId: req.draftOwnerId });
      if (!draft) return res.status(404).json({ success: false, error: 'Draft not found.' });
      res.json({ success: true, data: view(draft) });
    } catch { res.status(503).json({ success: false, error: 'Could not load draft.' }); }
  });
  router.post('/', async (req, res) => {
    let fields;
    try { fields = validate(req.body, true); } catch (e) { return res.status(400).json({ success: false, error: e.message }); }
    const filter = { ownerId: req.draftOwnerId, creationKey: req.body.operationId };
    const creationHash = hash({ ...fields, templateId: req.body.templateId });
    try {
      if (drafts.init) await drafts.init();
      let draft = await drafts.findOne(filter);
      if (!draft) {
        if (!await templates.exists({ _id: req.body.templateId })) return res.status(404).json({ success: false, error: 'Template not found.' });
        // Deterministic creation identity also protects retries when autoIndex is disabled.
        const creationId = createHash('sha256').update(String(req.draftOwnerId) + ':' + req.body.operationId).digest('hex').slice(0, 24);
        try { draft = await drafts.create({ _id: creationId, ...fields, ...filter, templateId: req.body.templateId, creationHash, revision: 1 }); }
        catch (e) { if (e.code !== 11000) throw e; draft = await drafts.findOne(filter); }
      }
      if (!draft || draft.creationHash !== creationHash) return res.status(409).json({ success: false, error: 'Save identifier already used with different content.' });
      if (draft.revision !== 1) return res.status(409).json({ success: false, error: 'This document has already changed. Find it in My Drafts before continuing.' });
      res.status(201).json({ success: true, data: view(draft) });
    } catch { res.status(503).json({ success: false, error: 'Could not save draft. Your text has been kept.' }); }
  });
  router.patch('/:id', async (req, res) => {
    if (!id(req.params.id)) return res.status(400).json({ success: false, error: 'Invalid draft ID.' });
    let fields;
    try { fields = validate(req.body, false); } catch (e) { return res.status(400).json({ success: false, error: e.message }); }
    const filter = { _id: req.params.id, ownerId: req.draftOwnerId };
    const lastHash = hash({ ...fields, revision: req.body.revision });
    try {
      let draft = await drafts.findOneAndUpdate({ ...filter, revision: req.body.revision },
        { $set: { ...fields, lastOperation: req.body.operationId, lastHash }, $inc: { revision: 1 } }, { new: true, runValidators: true });
      if (!draft) {
        draft = await drafts.findOne(filter);
        if (!draft) return res.status(404).json({ success: false, error: 'Draft not found.' });
        if (draft.lastOperation !== req.body.operationId || draft.lastHash !== lastHash) return res.status(409).json({ success: false, error: 'This draft changed elsewhere. Copy your edits before reopening the latest version.' });
      }
      res.json({ success: true, data: view(draft) });
    } catch { res.status(503).json({ success: false, error: 'Could not save draft. Your text has been kept.' }); }
  });
  return router;
}
export default createUserDraftRouter();
