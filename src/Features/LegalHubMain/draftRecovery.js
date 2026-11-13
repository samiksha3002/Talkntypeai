// In-memory recovery only: confidential text is never written to browser storage.
const buffers = new Map();
export const recoveryKey = (session, path) => (session || 'unsigned-tab') + ':' + path;
export function rememberDraft(key, html, saver) { if (key) buffers.set(key, { html, saver }); }
export const recoverDraft = key => key ? buffers.get(key)?.html : undefined;
export const recoverSaver = key => key ? buffers.get(key)?.saver : undefined;
export function forgetDraft(key) { if (key) buffers.delete(key); }
export const clearDraftRecovery = () => buffers.clear();
