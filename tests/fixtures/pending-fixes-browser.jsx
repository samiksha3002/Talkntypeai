import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { Quill } from 'react-quill-new';
import EditorTextarea from '../../src/Editor/EditorTextarea.jsx';
import EditorActions from '../../src/Editor/EditorActions.jsx';
import { printDocument } from '../../src/Editor/printDocument.js';
import Register from '../../src/components/Register.jsx';
import Packages from '../../src/components/Packages.jsx';
import MenuOption from '../../src/components/MenuOption.jsx';
import Diary from '../../src/pages/Diary.jsx';
import JudgementsPage from '../../src/components/JudgementsPage.jsx';
import { SearchProvider } from '../../src/components/Context/searchcontext.jsx';
import FontConvertCard from '../../src/components/Sidebar/FontConvertCard.jsx';
import { legacyFontPreviewEnabled } from '../../src/Editor/legacyFontPreview.js';

const results = [];
const check = (name, pass) => { results.push({ name, pass: !!pass }); if (!pass) throw Error(name); };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const wait = async predicate => { for (let i = 0; i < 200; i++) { if (predicate()) return; await sleep(25); } throw Error('Timed out'); };
let navigate;
function Fixture() {
  const [text, setText] = useState('');
  const ref = useRef();
  navigate = useNavigate();
  const location = useLocation();
  return <>
    <output id="route">{location.pathname + location.search}</output>
    <EditorActions manualText={text} setManualText={setText} quillRef={ref} />
    <EditorTextarea manualText={text} setManualText={setText} quillRef={ref} />
    <Packages />
    {location.pathname === '/register' && <Register />}
    <MenuOption title="Internal import" path="/import-ecourt" />
    <Diary />
    <SearchProvider><JudgementsPage /></SearchProvider>
    <FontConvertCard editorText="<p>मराठी नमस्ते English</p>" />
  </>;
}
window.alert = () => {};
localStorage.setItem('user', JSON.stringify({ _id: '000000000000000000000001' }));
localStorage.setItem('userId', '000000000000000000000001');
const root = createRoot(document.getElementById('root'));
root.render(<BrowserRouter><Fixture /></BrowserRouter>);
(async () => { try {
  await wait(() => document.querySelector('.ql-editor'));
  const q = Quill.find(document.querySelector('.ql-container'));
  q.setContents({ ops: [
    { insert: 'LEGAL अर्ज नमस्ते', attributes: { bold: true } }, { insert: '\n', attributes: { header: 1, align: 'center' } },
    { insert: 'English affidavit ', attributes: { font: 'arial', size: '18px', italic: true, underline: true } },
    { insert: 'मराठी अर्ज हिंदी नमस्ते', attributes: { color: '#123456', background: '#ffff00' } }, { insert: '\n', attributes: { align: 'right', indent: 1 } },
    { insert: 'ueLrs', attributes: { font: 'krutidev', bold: true } }, { insert: ' English retained' }, { insert: '\n' },
    { insert: 'First relief' }, { insert: '\n', attributes: { list: 'ordered' } },
    { insert: 'Nested relief' }, { insert: '\n', attributes: { list: 'ordered', indent: 1 } },
    { insert: 'मराठी मुद्दा' }, { insert: '\n', attributes: { list: 'bullet' } },
    { insert: '\n' }, { insert: 'Last paragraph', attributes: { font: 'courier-new' } }, { insert: '\n', attributes: { align: 'justify' } },
  ] }, 'user');
  await sleep(100);
  await document.fonts.load('16px KrutiDev');
  q.setSelection(5, 8);
  const before = { html: q.root.innerHTML, delta: JSON.stringify(q.getContents()), range: JSON.stringify(q.getSelection()), undo: JSON.stringify(q.history.stack), storage: JSON.stringify(localStorage) };
  let printFrame, printed = false, releaseFonts;
  const fontGate = new Promise(resolve => { releaseFonts = resolve; });
  const originalOpen = window.open;
  window.open = () => {
    printFrame = document.createElement('iframe');
    printFrame.style.cssText = 'width:900px;height:1200px';
    document.body.appendChild(printFrame);
    const popup = printFrame.contentWindow;
    const load = popup.document.fonts.load.bind(popup.document.fonts);
    popup.document.fonts.load = (...args) => fontGate.then(() => load(...args));
    popup.focus = () => {};
    popup.print = () => { printed = true; };
    return popup;
  };
  const actions = document.querySelector('[title="Print"]').closest('.bg-indigo-50');
  document.querySelector('[title="Print"]').click();
  await sleep(50);
  check('Print waits while required font loading is pending', !printed);
  releaseFonts();
  await wait(() => printed || actions.querySelector('[role="alert"]'));
  check('Print action prepares output without error', printed && !actions.querySelector('[role="alert"]'));
  const doc = printFrame.contentDocument;
  const clone = doc.querySelector('.ql-editor');
  check('Mixed-language text and paragraph structure are exact', clone.textContent === q.root.textContent && clone.querySelectorAll('p,li,h1').length === q.root.querySelectorAll('p,li,h1').length);
  const props = ['fontFamily','fontSize','fontWeight','fontStyle','textDecorationLine','textAlign','paddingLeft','lineHeight','marginTop','marginBottom','color','backgroundColor'];
  const originals = [...q.root.querySelectorAll('*')], copies = [...clone.querySelectorAll('*')];
  check('Every printed element matches editor typography, indentation, spacing and colors', originals.length === copies.length && originals.every((el, i) => props.every(prop => getComputedStyle(el)[prop] === doc.defaultView.getComputedStyle(copies[i])[prop])));
  check('Quill ordered/nested/bullet list markers are retained', [...q.root.querySelectorAll('.ql-ui')].every((el,i) => getComputedStyle(el, '::before').content === doc.defaultView.getComputedStyle(clone.querySelectorAll('.ql-ui')[i], '::before').content));
  check('KrutiDev loaded before print invocation', [...doc.fonts].some(f => /KrutiDev/i.test(f.family) && f.status === 'loaded'));
  const pageRule = [...doc.styleSheets[0].cssRules].find(rule => rule.cssText.startsWith('@page'));
  check('A4 repeats editor page margins without double padding', pageRule?.style.size.includes('a4') && ['Top','Right','Bottom','Left'].every(side => Math.abs(parseFloat(pageRule.style['margin'+side]) - parseFloat(getComputedStyle(q.root)['padding'+side])) < 0.1) && clone.style.padding === '0px');
  check('Print does not change HTML, Delta, selection, history or storage', before.html === q.root.innerHTML && before.delta === JSON.stringify(q.getContents()) && before.range === JSON.stringify(q.getSelection()) && before.undo === JSON.stringify(q.history.stack) && before.storage === JSON.stringify(localStorage));
  await fetch('/print-html', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '<!doctype html>' + doc.documentElement.outerHTML });
  printFrame.remove();
  window.open = () => null;
  let rejected = false; try { await printDocument(q); } catch (e) { rejected = e.message.includes('Allow popups'); }
  check('Blocked popup gives actionable error', rejected);
  let attempted = false; window.open = () => { attempted = true; return null; };
  q.root.style.fontFamily = 'Shivaji01';
  rejected = false; try { await printDocument(q); } catch (e) { rejected = e.message.includes('Shivaji is unavailable'); }
  q.root.style.fontFamily = '';
  check('Unverified legacy font is refused before opening output', rejected && !attempted);
  window.open = () => {
    const frame = document.createElement('iframe'); document.body.appendChild(frame);
    const popup = frame.contentWindow;
    let closeCalled = false;
    popup.close = () => { closeCalled = true; frame.remove(); };
    popup.print = () => { throw Error('Must not print missing font'); };
    popup.document.fonts.load = async () => [];
    window.__fontClose = () => closeCalled;
    return popup;
  };
  rejected = false; try { await printDocument(q); } catch(e) { rejected = e.message.includes('KrutiDev could not load'); }
  check('Missing KrutiDev fails closed and closes unusable output', rejected && window.__fontClose());
  window.open = originalOpen;
  q.setText(''); await sleep(50);
  window.open = () => { const frame = document.createElement('iframe'); document.body.appendChild(frame); printFrame = frame; const popup = frame.contentWindow; popup.focus = () => {}; popup.print = () => {}; return popup; };
  await printDocument(q);
  check('Empty-editor placeholder is excluded from printing', !printFrame.contentDocument.body.textContent.includes('Start typing') && !printFrame.contentDocument.querySelector('[data-placeholder]'));
  printFrame.remove(); window.open = originalOpen;

  for (const plan of ['monthly','quarterly','half-yearly','yearly']) {
    document.querySelector(`a.pkg-btn[href="/register?plan=${plan}"]`).click();
    await wait(() => document.getElementById('route').textContent === `/register?plan=${plan}`);
    check(`Pricing ${plan} navigates to registration with plan`, document.body.textContent.includes('User Registration'));
  }
  const external = [...document.querySelectorAll('a')].find(a => a.textContent.includes('Open eCourts Website'));
  check('Diary eCourts link is external and securely isolated', external?.href === 'https://ecourts.gov.in/ecourts_home/' && external.target === '_blank' && external.rel === 'noopener noreferrer');
  [...document.querySelectorAll('a')].find(a => a.textContent.includes('Internal import')).click();
  await wait(() => document.getElementById('route').textContent === '/import-ecourt');
  check('Internal import link retains SPA navigation', true);
  [...document.querySelectorAll('a')].find(a => a.textContent.includes('Import CSV Cases')).click();
  await wait(() => document.getElementById('route').textContent === '/case-manager');
  check('Existing internal case-manager route is preserved', true);

  [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Filters').click();
  await wait(() => [...document.querySelectorAll('option')].some(o => o.textContent === 'All Years'));
  const year = [...document.querySelectorAll('select')].find(s => s.options[0]?.text === 'All Years');
  check('Judgment years include current year, 2026 and historical 1986', year.options[1].value === String(new Date().getFullYear()) && [...year.options].some(o => o.value === '2026') && [...year.options].some(o => o.value === '1986'));
  year.value = '2026'; year.dispatchEvent(new Event('change', { bubbles: true })); await sleep(30);
  const court = [...document.querySelectorAll('select')].find(s => s.options[0]?.text === 'All Courts');
  court.value = court.options[1].value; const chosenCourt = court.value; court.dispatchEvent(new Event('change', { bubbles: true })); await sleep(30);
  [...document.querySelectorAll('button')].find(b => b.textContent === 'Apply Filters').click();
  let requests;
  for (let i = 0; i < 100; i++) {
    requests = await (await fetch('/requests')).json();
    if (requests.length) break;
    await sleep(25);
  }
  check('Real judgment search request submits year=2026 and retains court/query', requests.some(r => r.year === '2026' && r.court === chosenCourt && r.q === 'judgment'));
  check('Private preview displays disabled Preeti/Shivaji options and clear blocker', document.querySelector('option[value="unicode-to-preeti"]')?.disabled && document.querySelector('option[value="unicode-to-shivaji"]')?.disabled && document.querySelector('[role="note"]')?.textContent.includes('conversion and export remain blocked'));
  check('Production ignores the preview flag', !legacyFontPreviewEnabled({ DEV: false, PROD: true, VITE_LEGACY_FONT_PREVIEW: 'true' }) && !legacyFontPreviewEnabled({ DEV: true, PROD: true, VITE_LEGACY_FONT_PREVIEW: 'true' }));
} catch(error) { results.push({ name: error.stack || error.message, pass: false }); }
window.__results = results;
})();
