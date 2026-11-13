// Keep the existing HTML key readable by older releases. Metadata belongs only
// to the exact saved HTML, so an older client cannot leave a stale font behind.
const legacyFonts = ['KrutiDev, sans-serif', 'Shivaji01, sans-serif', 'Preeti, sans-serif'];
export function readEditorAutosave(storage, ownerId) {
  if (!ownerId) return { html: '', fontFamily: '' };
  const html = storage.getItem(`autosave_${ownerId}`) || '';
  let fontFamily = '';
  try {
    const metadata = JSON.parse(storage.getItem(`autosave_font_${ownerId}`));
    if (metadata?.version === 1 && metadata.html === html && legacyFonts.includes(metadata.fontFamily)) {
      fontFamily = metadata.fontFamily;
    }
  } catch { /* Missing/malformed metadata never changes legacy HTML. */ }
  return { html, fontFamily };
}
export function writeEditorAutosave(storage, ownerId, html, fontFamily) {
  if (!ownerId) return;
  storage.setItem(`autosave_${ownerId}`, html);
  const normalizedFont = fontFamily.replace(/["']/g, '');
  if (legacyFonts.includes(normalizedFont)) {
    storage.setItem(`autosave_font_${ownerId}`, JSON.stringify({ version: 1, html, fontFamily: normalizedFont }));
  } else {
    storage.removeItem(`autosave_font_${ownerId}`);
  }
}
