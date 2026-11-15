import quillCSS from 'react-quill-new/dist/quill.core.css?raw';
import DOMPurify from 'dompurify';
import { exportSnapshot } from './exportDownload.js';
import { validateBlocks } from './exportModel.js';
import { legacyFontUnavailable } from '../../utils/legacyFontSupport.js';

// Freeze presentation on a detached clone. Never format, select or update Quill.
const properties = [
  'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant',
  'text-decoration', 'text-align', 'text-indent', 'text-transform',
  'overflow-wrap', 'word-break', 'line-height', 'letter-spacing', 'word-spacing', 'white-space', 'direction',
  'color', 'background-color', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border-top', 'border-right', 'border-bottom', 'border-left',
  'list-style-type', 'list-style-position', 'vertical-align',
];

export function printSnapshot(editor) {
  const { blocks, defaults } = exportSnapshot(editor);
  validateBlocks(blocks, defaults); // Keep existing unsupported-content/font safeguards.
  const source = editor.root;
  const view = source.ownerDocument.defaultView;
  const clone = source.cloneNode(true);
  const originals = [source, ...source.querySelectorAll('*')];
  const copies = [clone, ...clone.querySelectorAll('*')];
  const fonts = new Map();
  originals.forEach((element, i) => {
    const style = view.getComputedStyle(element);
    const unavailable = legacyFontUnavailable(style.fontFamily);
    if (unavailable) throw Error(unavailable);
    for (const property of properties) copies[i].style.setProperty(property, style.getPropertyValue(property));
    const family = style.fontFamily;
    fonts.set(family, (fonts.get(family) || '') + [...element.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(''));
    copies[i].removeAttribute('contenteditable');
    copies[i].removeAttribute('data-placeholder');
    copies[i].removeAttribute('id');
  });
  const rootStyle = view.getComputedStyle(source);
  const margins = ['Top', 'Right', 'Bottom', 'Left'].map(side => `${parseFloat(rootStyle['padding' + side]) || 0}px`);
  DOMPurify.sanitize(clone, { IN_PLACE: true });
  clone.classList.remove('ql-blank');
  // Page margins repeat on every page; editor padding must not count twice.
  Object.assign(clone.style, { padding: '0', margin: '0', border: '0', width: 'auto', height: 'auto', minHeight: '0', overflow: 'visible', boxShadow: 'none' });
  return { clone, fonts, margins };
}

async function waitForFonts(doc, fonts) {
  if (!doc.fonts) throw Error('This browser cannot verify print fonts. Please use a current browser.');
  for (const [family, sample] of fonts) {
    if (!sample.trim()) continue;
    const loaded = await doc.fonts.load(`16px ${family}`, sample);
    if (/\bkrutidev\b/i.test(family) && !loaded.some(face => face.status === 'loaded' && /krutidev/i.test(face.family))) {
      throw Error('KrutiDev could not load. Printing stopped to prevent incorrect legacy text.');
    }
  }
  await doc.fonts.ready;
}

export async function printDocument(editor, host = window) {
  const snapshot = printSnapshot(editor);
  // Open during the click event, before awaiting fonts, to avoid popup blocking.
  const popup = host.open('', '_blank');
  if (!popup) throw Error('Allow popups for TalknTypeAI and try printing again. Your document is unchanged.');
  let timer;
  try {
    popup.opener = null;
    const doc = popup.document;
    doc.open();
    doc.write('<!doctype html><html><head><meta charset="utf-8"><title>Print Document</title></head><body></body></html>');
    doc.close();
    const style = doc.createElement('style');
    const fontURL = new URL('/KRDEV010.ttf', host.location.href).href;
    style.textContent = quillCSS + `
      @font-face { font-family: 'KrutiDev'; src: url(${JSON.stringify(fontURL)}) format('truetype'); font-weight: normal; font-style: normal; }
      @page { size: A4 portrait; margin: ${snapshot.margins.join(' ')}; }
      html, body { margin: 0; padding: 0; background: white; }
      .ql-editor { box-sizing: border-box; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .ql-editor.ql-blank::before { content: none; }
      @media screen { body { width: calc(210mm - ${snapshot.margins[1]} - ${snapshot.margins[3]}); margin: ${snapshot.margins.join(' ')}; } }
    `;
    doc.head.appendChild(style);
    doc.body.appendChild(doc.importNode(snapshot.clone, true));
    doc.body.getBoundingClientRect();
    await Promise.race([
      waitForFonts(doc, snapshot.fonts),
      new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Print fonts did not load in time. Please retry. Your document is unchanged.')), 15000); }),
    ]);
    clearTimeout(timer);
    doc.body.getBoundingClientRect();
    if (popup.closed) throw Error('The print window was closed. Your document is unchanged.');
    popup.focus();
    popup.print();
  } catch (error) {
    popup.close();
    throw error;
  } finally { clearTimeout(timer); }
}
