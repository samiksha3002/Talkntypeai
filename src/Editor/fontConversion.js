// H3: convert text only; Quill owns whitespace, embeds and block attributes.
const copy = value => JSON.parse(JSON.stringify(value));
export async function convertFontDelta(delta, conversionType, request) {
  // Never convert halves of a Unicode character independently across style runs.
  const text = (delta.ops || []).map(op => typeof op.insert === 'string' ? op.insert : '\ufffc').join('');
  const boundaries = typeof Intl.Segmenter === 'function'
    ? new Set([...new Intl.Segmenter('hi', { granularity: 'grapheme' }).segment(text)].map(part => part.index)) : null;
  let offset = 0;
  for (const op of delta.ops || []) {
    offset += typeof op.insert === 'string' ? op.insert.length : 1;
    if (offset < text.length && (boundaries ? !boundaries.has(offset) : /[\p{M}\u200c\u200d]/u.test(text[offset]) || text[offset - 1] === '\u094d')) {
      throw new Error('Formatting splits a character cluster. Keep each character together and retry; your document was kept.');
    }
  }
  const ops = [];
  const positions = [];
  const cache = new Map();
  let oldPosition = 0, newPosition = 0;
  const append = (original, converted, attributes) => {
    ops.push({ insert: converted, ...(attributes ? { attributes: copy(attributes) } : {}) });
    const oldLength = typeof original === 'string' ? original.length : 1;
    const newLength = typeof converted === 'string' ? converted.length : 1;
    positions.push({ oldPosition, newPosition, oldLength, newLength });
    oldPosition += oldLength; newPosition += newLength;
  };
  for (const op of delta.ops || []) {
    if (typeof op.insert !== 'string') { append(op.insert, copy(op.insert), op.attributes); continue; }
    if (!op.insert.trim()) { append(op.insert, op.insert, op.attributes); continue; }
    // Never ask a converter to interpret paragraph separators or empty lines.
    for (const line of op.insert.split(/([\r\n]+)/)) {
      if (!line) continue;
      if (!line.trim()) { append(line, line, op.attributes); continue; }
      const [, leading, core, trailing] = /^(\s*)([\s\S]*?\S)(\s*)$/u.exec(line);
      const convertCore = async value => {
        if (!cache.has(value)) cache.set(value, Promise.resolve().then(() => request(value, conversionType)));
        let result = await cache.get(value);
        if (typeof result !== 'string' || !result.trim() || /[\r\n]/.test(result)) throw new Error('Invalid font conversion response. Original document was kept.');
        const spaces = value.match(/\s+/gu) || [];
        if ((result.match(/\s+/gu) || []).length !== spaces.length) throw new Error('Conversion changed word spacing. Original document was kept.');
        let n = 0;
        return result.replace(/\s+/gu, () => spaces[n++]);
      };
      let converted;
      if (['unicode-to-krutidev','mangal-to-krutidev','unicode-to-shivaji','unicode-to-preeti','mangal-to-unicode'].includes(conversionType) && /[<>]/.test(core)) {
        // Existing forward converters strip HTML; Quill supplies plain text.
        // Keep literal angle brackets local rather than letting them look like tags.
        converted = '';
        for (const part of core.split(/([<>])/)) {
          if (!part || /^[<>]$/.test(part) || !part.trim()) { converted += part; continue; }
          const [, before, value, after] = /^(\s*)([\s\S]*?\S)(\s*)$/u.exec(part);
          converted += before + await convertCore(value) + after;
        }
      } else {
        converted = await convertCore(core);
      }
      append(line, leading + converted + trailing, op.attributes);
    }
  }
  return { delta: { ops }, mapIndex(index) {
    const part = positions.find(p => index < p.oldPosition + p.oldLength);
    if (!part) return newPosition;
    return part.newPosition + Math.min(part.newLength, Math.round((index - part.oldPosition) * part.newLength / part.oldLength));
  } };
}
export async function requestFontConversion(baseUrl, text, conversionType, { fetcher = fetch, signal } = {}) {
  const response = await fetcher(baseUrl + '/api/font/convert', { method: 'POST', signal,
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, conversionType }) });
  if (!(response.headers.get('content-type') || '').includes('application/json')) throw new Error('Font conversion service returned a non-JSON response.');
  const result = await response.json();
  if (!response.ok || result.success !== true || typeof result.convertedText !== 'string') throw new Error(result.error || 'Font conversion failed.');
  return result.convertedText;
}
export async function convertEditorFont(editor, conversionType, request, { isCurrent = () => true, fallbackRange } = {}) {
  const original = copy(editor.getContents());
  const result = await convertFontDelta(original, conversionType, request);
  if (!isCurrent()) return false;
  if (JSON.stringify(editor.getContents()) !== JSON.stringify(original)) throw new Error('The document changed during conversion. Your edits were kept. Please retry.');
  const range = editor.getSelection() || fallbackRange;
  editor.setContents(result.delta, 'api');
  if (range) {
    const start = Math.min(result.mapIndex(range.index), editor.getLength() - 1);
    const end = Math.min(result.mapIndex(range.index + range.length), editor.getLength() - 1);
    editor.setSelection(start, Math.max(0, end - start), 'silent');
  }
  const fonts = { 'unicode-to-krutidev': '"KrutiDev", sans-serif', 'mangal-to-krutidev': '"KrutiDev", sans-serif',
    'unicode-to-shivaji': '"Shivaji01", sans-serif', 'unicode-to-preeti': 'Preeti, sans-serif' };
  if (fonts[conversionType]) editor.root.style.fontFamily = fonts[conversionType];
  else if (['krutidev-to-unicode','shivaji-to-unicode','mangal-to-unicode'].includes(conversionType)) editor.root.style.fontFamily = '';
  return true;
}
