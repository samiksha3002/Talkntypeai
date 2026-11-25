import { clearDraftRecovery } from './draftRecovery.js';
export function resolveDraftApi(base) {
  if (!base) throw new Error('Configure VITE_DRAFT_API_URL for the Express API before using drafts.');
  const url = new URL(base);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) throw new Error('Draft API requires HTTPS (except local development).');
  if (url.username || url.password || url.search || url.hash) throw new Error('Invalid draft API configuration.');
  return url.href.replace(/\/$/, '').replace(/\/api$/, '') + '/api';
}
export const SESSION_KEY = 'tnt_draft_session';
export const SESSION_STORAGE_MESSAGE = 'Secure draft session storage is unavailable. Enable session storage and sign in again. Your unsaved text has been kept.';
// Shape of the server-issued HS256 JWT (header.payload.signature). Verified server-side only.
export const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{10,200}\.[A-Za-z0-9_-]{10,1000}\.[A-Za-z0-9_-]{43}$/;
let storageUnavailable = false;
export function storeDraftSession(session) {
  clearDraftRecovery();
  try {
    sessionStorage.removeItem(SESSION_KEY);
    if (session?.token && SESSION_TOKEN_PATTERN.test(session.token)) {
      sessionStorage.setItem(SESSION_KEY, session.token);
      if (sessionStorage.getItem(SESSION_KEY) !== session.token) throw new Error('Storage did not retain session.');
    }
    storageUnavailable = false;
    return true;
  } catch {
    // Never authorize with a previous token after a failed replacement/removal.
    storageUnavailable = true;
    return false;
  }
}
export function readDraftSession() {
  if (storageUnavailable) throw new Error(SESSION_STORAGE_MESSAGE);
  try { return sessionStorage.getItem(SESSION_KEY); }
  catch { storageUnavailable = true; throw new Error(SESSION_STORAGE_MESSAGE); }
}
export function getDraftSession() {
  try { return readDraftSession(); } catch { return null; }
}
export function createDraftClient({ base, fetcher = (...args) => fetch(...args), token = readDraftSession } = {}) {
  return async (path, { method = 'GET', body, signal, publicRequest = false } = {}) => {
    const api = resolveDraftApi(base);
    const session = publicRequest ? null : token();
    if (!publicRequest && !session) throw new Error('Sign in again to securely access drafts. Your unsaved text has been kept.');
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timeout = setTimeout(abort, 20000);
    try {
      const response = await fetcher(api + path, { method, cache: 'no-store', redirect: 'error', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: 'Bearer ' + session } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}) });
      let data;
      try { data = await response.json(); } catch { throw new Error('Draft service returned an invalid response. Your text has been kept.'); }
      if (!response.ok || data?.success !== true) throw new Error(data?.error || data?.message || 'Draft request failed (' + response.status + ').');
      return data;
    } finally { clearTimeout(timeout); signal?.removeEventListener('abort', abort); }
  };
}
export const draftRequest = (...args) => createDraftClient({ base: import.meta.env?.VITE_DRAFT_API_URL })(...args);
export function validDocument(d) {
  return d && /^[a-f0-9]{24}$/i.test(d._id) && /^[a-f0-9]{24}$/i.test(d.templateId) &&
    typeof d.title === 'string' && typeof d.content === 'string' && Number.isSafeInteger(d.revision) && d.revision > 0;
}
export class DraftSaver {
  constructor(request, document = null) { this.request = request; this.document = document; this.pending = null; this.busy = false; }
  async save(fields) {
    if (this.busy) throw new Error('A save is already in progress.');
    this.busy = true;
    try {
      // Replay uncertain requests unchanged before submitting more recent edits.
      if (this.pending) await this.flush();
      const d = this.document;
      if (!d || ['title', 'category', 'content'].some(k => (d[k] || '') !== (fields[k] || ''))) {
        this.pending = { path: d ? '/user-drafts/' + d._id : '/user-drafts', method: d ? 'PATCH' : 'POST',
          body: { title: fields.title, category: fields.category || '', content: fields.content, operationId: crypto.randomUUID(),
            ...(d ? { revision: d.revision } : { templateId: fields.templateId }) } };
        await this.flush();
      }
      return this.document;
    } finally { this.busy = false; }
  }
  async flush() {
    const p = this.pending;
    const result = await this.request(p.path, { method: p.method, body: p.body });
    if (!validDocument(result.data) || (this.document && result.data._id !== this.document._id) ||
      result.data.templateId !== (this.document?.templateId || p.body.templateId) ||
      (p.method === 'POST' && result.data.revision !== 1) ||
      (p.method === 'PATCH' && result.data.revision !== p.body.revision + 1)) throw new Error('Save was not confirmed. Keep this page open and retry.');
    this.document = result.data;
    this.pending = null;
  }
}
