// H3: convert text only; Quill owns whitespace, embeds and block attributes.
import { conversionUnavailable } from '../../utils/legacyFontSupport.js';
import { defaultTypingFont } from './editorInput.js';
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
  const unavailable = conversionUnavailable(conversionType);
  if (unavailable) throw new Error(unavailable);
  if (['unicode-to-krutidev', 'mangal-to-krutidev'].includes(conversionType)) {
    return convertKrutiSelection(editor, conversionType, request, { isCurrent, fallbackRange });
  }
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

// The placeholder is CSS, not a Delta operation. Never change the root font:
// KrutiDev reinterprets Latin letters, including English and Quill's hint.
async function convertKrutiSelection(editor, type, request, { isCurrent, fallbackRange }) {
  const document = editor.getContents();
  const original = copy(document);
  const range = copy(editor.getSelection() || fallbackRange || { index: 0, length: 0 });
  const text = original.ops.map(op => typeof op.insert === 'string' ? op.insert : '\ufffc').join('');
  const start = range.length ? range.index : 0;
  const end = range.length ? range.index + range.length : text.length;
  const boundaries = new Set([0, text.length]);
  if (typeof Intl.Segmenter === 'function') {
    for (const part of new Intl.Segmenter('hi', { granularity: 'grapheme' }).segment(text)) boundaries.add(part.index);
  } else {
    for (let index = 1; index < text.length; index++) {
      if (!/[\p{M}\u200c\u200d]/u.test(text[index]) && text[index - 1] !== '\u094d') boundaries.add(index);
    }
  }
  let position = 0;
  for (const op of original.ops) {
    position += typeof op.insert === 'string' ? op.insert.length : 1;
    if (!boundaries.has(position)) throw new Error('Formatting splits a character cluster. Keep each character together and retry; your document was kept.');
  }
  // A collapsed caret targets the document; an expanded range targets selection.
  if (!boundaries.has(start) || !boundaries.has(end)) throw new Error('Selection splits a character cluster. Select the whole character and retry; your document was kept.');
  const ops = [], changes = [], cache = new Map();
  position = 0;
  for (const op of original.ops) {
    const length = typeof op.insert === 'string' ? op.insert.length : 1;
    if (typeof op.insert !== 'string' || position >= end || position + length <= start) {
      ops.push(copy(op)); position += length; continue;
    }
    const left = Math.max(0, start - position), right = Math.min(length, end - position);
    const append = (insert, attributes = op.attributes) => { if (insert) ops.push({ insert, ...(attributes ? { attributes: copy(attributes) } : {}) }); };
    append(op.insert.slice(0, left));
    const selected = op.insert.slice(left, right);
    let cursor = 0;
    for (const match of selected.matchAll(/[\u0900-\u097f\ua8e0-\ua8ff]+(?:[\u200c\u200d][\u0900-\u097f\ua8e0-\ua8ff]+)*/gu)) {
      append(selected.slice(cursor, match.index));
      if (!cache.has(match[0])) cache.set(match[0], convertFontDelta({ ops: [{ insert: match[0] }] }, type, request));
      const result = await cache.get(match[0]);
      const converted = result.delta.ops.map(part => part.insert).join('');
      append(converted, { ...op.attributes, font: 'krutidev' });
      changes.push({ index: position + left + match.index, before: match[0].length, after: converted.length });
      cursor = match.index + match[0].length;
    }
    append(selected.slice(cursor)); append(op.insert.slice(right));
    position += length;
  }
  if (!isCurrent()) return false;
  if (!changes.length) {
    if (!range.length) defaultTypingFont(editor, range, 'user');
    return false;
  }
  if (JSON.stringify(editor.getContents()) !== JSON.stringify(original)) throw new Error('The document changed during conversion. Your edits were kept. Please retry.');
  const Delta = document.constructor;
  const patch = document.diff(new Delta(ops));
  editor.history.cutoff();
  editor.updateContents(patch, 'user');
  editor.history.cutoff();
  const mapIndex = index => {
    let shift = 0;
    for (const change of changes) {
      if (index < change.index) break;
      if (index <= change.index + change.before) return change.index + shift + Math.round((index - change.index) * change.after / change.before);
      shift += change.after - change.before;
    }
    return index + shift;
  };
  const mappedStart = Math.min(mapIndex(range.index), editor.getLength() - 1);
  editor.setSelection(mappedStart, Math.max(0, Math.min(mapIndex(range.index + range.length), editor.getLength() - 1) - mappedStart), 'silent');
  if (!range.length) defaultTypingFont(editor, { index: mappedStart, length: 0 }, 'user');
  return true;
}
