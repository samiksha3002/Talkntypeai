// Keep the existing HTML key readable by older releases. Metadata belongs only
// to the exact saved HTML, so an older client cannot leave a stale font behind.
const legacyFonts = ['KrutiDev, sans-serif', 'Shivaji01, sans-serif', 'Preeti, sans-serif'];
export function readEditorAutosave(storage, ownerId) {
  if (!ownerId) return { html: '', fontFamily: '' };
  const html = storage.getItem(`autosave_${ownerId}`) || '';
  let fontFamily = '';
  const storedMetadata = storage.getItem(`autosave_font_${ownerId}`);
  try {
    const metadata = JSON.parse(storedMetadata);
    if (metadata?.version === 1 && metadata.html === html && legacyFonts.includes(metadata.fontFamily)) {
      fontFamily = metadata.fontFamily;
    }
  } catch { /* Missing/malformed metadata never changes legacy HTML. */ }
  return { html, fontFamily };
}
export function writeEditorAutosave(storage, ownerId, html, fontFamily) {
  if (!ownerId) return;
  const htmlKey = `autosave_${ownerId}`, fontKey = `autosave_font_${ownerId}`;
  const previousHtml = storage.getItem(htmlKey), previousFont = storage.getItem(fontKey);
  const normalizedFont = (fontFamily || '').replace(/["']/g, '');
  const metadata = legacyFonts.includes(normalizedFont) ? JSON.stringify({ version: 1, html, fontFamily: normalizedFont }) : null;
  try {
    // Commit legacy metadata first; don't clear old metadata before HTML succeeds.
    if (metadata !== null) storage.setItem(fontKey, metadata);
    storage.setItem(htmlKey, html);
    if (metadata === null) storage.removeItem(fontKey);
    if (storage.getItem(htmlKey) !== html || storage.getItem(fontKey) !== metadata) throw new Error('Storage did not retain the document.');
  } catch (error) {
    // Best effort rollback; the controller also retains the complete latest snapshot.
    for (const [key, value] of [[fontKey, previousFont], [htmlKey, previousHtml]]) {
      try { if (value === null) storage.removeItem(key); else storage.setItem(key, value); }
      catch { /* Attempt both rollbacks; failed storage is never reported as saved. */ }
    }
    throw error;
  }
}

const pendingDocuments = new Map();
const recoveryKey = owner => `tnt_editor_recovery_${owner}`;
const normalizedFont = font => String(font || '').replace(/["']/g, '');
const validSnapshot = value => value?.version === 1 && typeof value.html === 'string' && typeof value.fontFamily === 'string' &&
  (value.fontFamily === '' || legacyFonts.includes(value.fontFamily.replace(/["']/g, '')));
export function restoreEditorAutosave({ storage, recoveryStorage, ownerId }) {
  let saved = { html: '', fontFamily: '' }, readError = false;
  try { saved = readEditorAutosave(storage(), ownerId); } catch {
    readError = true;
    try { if (ownerId) saved.html = storage().getItem(`autosave_${ownerId}`) || ''; } catch { /* Do not infer or overwrite unread content. */ }
  }
  let recovery = pendingDocuments.get(ownerId);
  if (ownerId && !recovery) {
    try { const value = JSON.parse(recoveryStorage().getItem(recoveryKey(ownerId))); if (validSnapshot(value)) recovery = value; } catch { /* The original autosave remains readable. */ }
  }
  // A stale session copy must never replace a newer successful local save.
  if (recovery && !readError) {
    const alreadySaved = saved.html === recovery.html && normalizedFont(saved.fontFamily) === normalizedFont(recovery.fontFamily);
    const baseChanged = saved.html !== recovery.baseHtml || normalizedFont(saved.fontFamily) !== normalizedFont(recovery.baseFontFamily);
    if (alreadySaved || baseChanged) recovery = null;
  }
  return { ...(recovery || saved), recovered: !!recovery, readError };
}

export function createEditorAutosave({ storage, recoveryStorage, ownerId, initial, onStatus = () => {}, canWrite = () => true,
  schedule = setTimeout, cancel = clearTimeout, delay = 1000 }) {
  let snapshot = { html: initial.html, fontFamily: initial.fontFamily || '' }, dirty = !!initial.recovered, timer;
  let baseHtml = initial.baseHtml ?? initial.html;
  let baseFontFamily = initial.baseFontFamily ?? initial.fontFamily ?? '';
  const retain = () => {
    if (!ownerId) return;
    pendingDocuments.set(ownerId, { version: 1, ...snapshot, baseHtml, baseFontFamily });
    try { recoveryStorage().setItem(recoveryKey(ownerId), JSON.stringify({ version: 1, ...snapshot, baseHtml, baseFontFamily })); } catch { /* RAM recovery remains; warn before leaving. */ }
  };
  const clearTimer = () => { if (timer !== undefined) cancel(timer); timer = undefined; };
  const controller = {
    get snapshot() { return { ...snapshot }; },
    get dirty() { return dirty; },
    stage(html, fontFamily = snapshot.fontFamily) {
      if (html === snapshot.html && fontFamily === snapshot.fontFamily) return;
      snapshot = { html, fontFamily }; dirty = true;
      if (ownerId) pendingDocuments.set(ownerId, { version: 1, ...snapshot, baseHtml, baseFontFamily });
      onStatus('pending'); clearTimer(); timer = schedule(() => controller.flush(), delay);
    },
    flush() {
      clearTimer();
      if (!dirty) return !initial.readError;
      try {
        if (!ownerId || !canWrite()) throw new Error('Account changed.');
        if (initial.readError) throw new Error('Existing saved work could not be read.');
        writeEditorAutosave(storage(), ownerId, snapshot.html, snapshot.fontFamily);
        dirty = false; baseHtml = snapshot.html; baseFontFamily = snapshot.fontFamily; pendingDocuments.delete(ownerId);
        try { recoveryStorage().removeItem(recoveryKey(ownerId)); } catch { /* Remove stale recovery below by matching saved content. */ }
        onStatus('saved'); return true;
      } catch {
        retain(); onStatus('error'); return false;
      }
    },
    dispose() { controller.flush(); clearTimer(); },
  };
  return controller;
}

export function bindEditorAutosaveLifecycle(controller, windowTarget, documentTarget) {
  const flush = () => controller.flush();
  const hidden = () => { if (documentTarget.visibilityState === 'hidden') flush(); };
  const beforeUnload = event => {
    if (!controller.flush()) { event.preventDefault(); event.returnValue = ''; }
  };
  windowTarget.addEventListener('pagehide', flush);
  windowTarget.addEventListener('beforeunload', beforeUnload);
  documentTarget.addEventListener('visibilitychange', hidden);
  return () => {
    controller.dispose();
    windowTarget.removeEventListener('pagehide', flush);
    windowTarget.removeEventListener('beforeunload', beforeUnload);
    documentTarget.removeEventListener('visibilitychange', hidden);
  };
}
