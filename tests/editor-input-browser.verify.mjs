// Local synthetic documents only. No app backend, DB, customer profile or external network.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
const express = require('express'), esbuild = require('esbuild');
const {default: fontRouter} = await import('../routes/fontConvert.js');
const app = express(), requests = [];
let bundle = '';
const paths = [];
app.use((req,res,next) => { paths.push(req.path); next(); });
app.use(express.json());
app.use('/api/font', (req,res,next) => { requests.push(req.body); next(); }, fontRouter);
app.get('/config.json', (req,res) => res.json({ API_URL: origin }));
app.get('/KRDEV010.ttf', (req,res) => res.sendFile(path.resolve('public/KRDEV010.ttf')));
app.get('/quill.css', (req,res) => res.type('css').send(fs.readFileSync(require.resolve('react-quill-new/dist/quill.snow.css'),'utf8')));
app.get('/editor.css', (req,res) => res.type('css').send(fs.readFileSync('src/index.css','utf8')));
app.get('/fixture.js', (req,res) => res.type('js').send(bundle));
app.get('/', (req,res) => res.type('html').send('<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/quill.css"><link rel="stylesheet" href="/editor.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>'));
const server = app.listen(0,'127.0.0.1');
await new Promise(resolve => server.once('listening',resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const profile = fs.mkdtempSync(path.join(os.tmpdir(),'tnt-input-browser-'));
let chrome, ws;
const sleep = ms => new Promise(resolve => setTimeout(resolve,ms));
try {
  const built = await esbuild.build({ entryPoints: ['tests/fixtures/editor-input-browser.jsx'], bundle: true, write: false, format: 'iife', loader: { '.css': 'empty', '.png': 'dataurl', '.jpg': 'dataurl' }, define: {
    'import.meta.env': JSON.stringify({DEV:false,PROD:true,VITE_LEGACY_FONT_PREVIEW:'false'}),
    'import.meta.env.VITE_API_URL': JSON.stringify(origin), 'import.meta.env.VITE_DRAFT_API_URL': JSON.stringify(origin),
    'import.meta.env.VITE_TNT_AI_API_URL': JSON.stringify(origin + '/api/chat'), 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true', 'import.meta.env.VITE_LEGACY_FONT_PREVIEW': JSON.stringify('false'), 'process.env.NODE_ENV': JSON.stringify('production'),
  }, plugins: [{ name: 'raw-css', setup(build) {
    build.onResolve({ filter: /\.css\?raw$/ }, args => ({ path: require.resolve(args.path.slice(0,-4)), namespace: 'raw-css' }));
    build.onLoad({ filter: /.*/, namespace: 'raw-css' }, args => ({ contents: fs.readFileSync(args.path,'utf8'), loader: 'text' }));
  } }], logLevel: 'silent' });
  bundle = built.outputFiles[0].text;
  chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new','--disable-gpu','--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run','--no-default-browser-check','--proxy-server=http://127.0.0.1:9','--proxy-bypass-list=127.0.0.1;localhost','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'], { windowsHide: true, stdio: 'ignore' });
  for(let i=0;i<100&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));i++) await sleep(100);
  const port = fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  ws = new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  let id=0; const pending=new Map();
  ws.onmessage=event=>{const message=JSON.parse(event.data);if(message.method==='Runtime.exceptionThrown')console.log('Browser exception:',message.params.exceptionDetails.text,message.params.exceptionDetails.exception?.description);if(message.id){const task=pending.get(message.id);pending.delete(message.id);if(message.error)task?.reject(Error(message.error.message));else task?.resolve(message.result);}};
  const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});
  const evaluate=async expression=>{const response=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(response.exceptionDetails)throw Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text);return response.result.value;};
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:origin});
  for(let i=0;i<100;i++){if(await evaluate('!!document.querySelector(".ql-editor")'))break;await sleep(50);}
  const results=[];
  const check=async(name,expression)=>{const pass=!!await evaluate(expression);results.push({name,pass});console.log(`${pass?'PASS':'FAIL'} ${name}`);if(!pass)console.log(await evaluate('({text:q().getText(),delta:JSON.stringify(q().getContents()),range:q().getSelection(),root:q().root.style.fontFamily,alerts:window.__alerts})'));};
  const input=async text=>{await send('Input.insertText',{text});await sleep(60)};
  const key=async(key,code,extra={})=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,...extra});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,...extra});await sleep(60)};
  await sleep(200);
  await evaluate('q().focus(); q().setSelection(0,0,"user")');
  for (const letter of 'English affidavit') await input(letter);
  await check('fresh browser typing stays Latin',`q().getText()==='English affidavit\\n' && !q().getFormat(0,1).font && !q().root.style.fontFamily`);
  if(paths.some(p=>p.includes('transliterat')))throw Error('Typing requested transliteration');
  await check('typing does not request transliteration',`window.__alerts.length===0 && q().root.lang==='en' && document.querySelector('aside select').value==='en-IN'`);
  await evaluate(`q().setContents({ops:[{insert:'English ',attributes:{italic:true}},{insert:'\u0928\u092e\u0938\u094d\u0924\u0947',attributes:{bold:true}},{insert:' tail'},{insert:'\\n',attributes:{align:'center'}}]},'user');q().history.cutoff();q().setSelection(8,6,'user');`);
  const before=await evaluate('JSON.stringify(q().getContents())');
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Convert Font')).click()`);
  for(let i=0;i<100;i++){if(await evaluate(`q().getText().includes('ueLrs')`))break;await sleep(50);}
  await check('real API converts selected Hindi and keeps English and paragraph format',`q().getText()==='English ueLrs tail\\n' && q().getFormat(8,5).font==='krutidev' && q().getFormat(8,5).bold && q().getFormat(0,1).italic && q().getFormat(0,1).align==='center' && !q().root.style.fontFamily`);
  await check('mapped selection survives conversion',`q().getSelection()?.index===8 && q().getSelection()?.length===5`);
  const after=await evaluate('JSON.stringify(q().getContents())');
  await evaluate('q().history.undo()');
  await check('one undo restores exact original Delta',`JSON.stringify(q().getContents())===${JSON.stringify(before)}`);
  await evaluate('q().history.redo()');
  await check('redo restores exact conversion',`JSON.stringify(q().getContents())===${JSON.stringify(after)}`);
  await key('ArrowRight','ArrowRight');
  await input(' English');
  await check('Latin typing at converted span boundary does not inherit KrutiDev',`q().getText()==='English ueLrs English tail\\n' && q().getFormat(13,8).font!=='krutidev' && q().getFormat(13,8).bold`);
  await input(' \u092e\u0930\u093e\u0920\u0940 \u0939\u093f\u0902\u0926\u0940');
  await check('intentional Unicode Marathi and Hindi stay Unicode without legacy font',`q().getText().includes('\u092e\u0930\u093e\u0920\u0940 \u0939\u093f\u0902\u0926\u0940') && q().getFormat(22,1).font!=='krutidev'`);
  // Use the actual Quill toolbar to deliberately opt into legacy typing.
  const click=async selector=>{const rect=await evaluate(`(() => {const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...rect});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...rect});await sleep(60);};
  await click('.ql-font .ql-picker-label');
  await click('.ql-font .ql-picker-item[data-value="krutidev"]');
  for (const letter of 'ueLrs') await input(letter);
  await check('explicit toolbar KrutiDev typing remains available',`q().getFormat(q().getSelection().index-1,1).font==='krutidev'`);
  await key('a','KeyA',{modifiers:2,windowsVirtualKeyCode:65});
  await key('Backspace','Backspace');
  await check('empty placeholder is Latin and absent from document text',`q().getText()==='\\n' && q().root.dataset.placeholder==='Start typing or speaking...' && !getComputedStyle(q().root,'::before').fontFamily.includes('KrutiDev')`);
  await input('Normal English');
  await check('typing after clearing converted content defaults to Latin',`q().getText()==='Normal English\\n' && q().getFormat(0,1).font!=='krutidev'`);
  for (const selected of [true, false]) {
    const mode = selected ? 'selection' : 'whole document';
    await evaluate(`q().setContents({ops:[{insert:'English ',attributes:{italic:true}},{insert:'अर्ज',attributes:{bold:true}},{insert:' tail '},{insert:'मराठी',attributes:{underline:true}},{insert:'\\n',attributes:{align:'right'}}]},'user');q().history.cutoff();q().setSelection(${selected ? '8,4' : '12,0'},'user');q().blur()`);
    const original = await evaluate('JSON.stringify(q().getContents())');
    const historyLength = await evaluate('q().history.stack.undo.length');
    await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Convert Font')).click()`);
    const expected = selected ? 'English vtZ tail मराठी\n' : 'English vtZ tail ejkBh\n';
    for(let i=0;i<100;i++){if(await evaluate(`q().getText()===${JSON.stringify(expected)}`))break;await sleep(50);}
    await check(mode+' converts only the intended Marathi runs and preserves English',`q().getText()===${JSON.stringify(expected)} && !q().getFormat(0,1).font && !q().getFormat(11,1).font && q().getFormat(8,3).font==='krutidev' && q().getFormat(17,1).font===${selected ? 'undefined' : "'krutidev'"} && !q().root.style.fontFamily`);
    if(await evaluate('window.__alerts.length'))throw Error(mode+': '+await evaluate('window.__alerts.join("; ")'));
    await check(mode+' preserves inline formatting, paragraph formatting and mapped cursor',`q().getFormat(0,1).italic && q().getFormat(8,3).bold && q().getFormat(17,1).underline && q().getFormat(0,1).align==='right' && q().getSelection()?.index===${selected ? 8 : 11} && q().getSelection()?.length===${selected ? 3 : 0}`);
    const converted = await evaluate('JSON.stringify(q().getContents())');
    await check(mode+' adds exactly one undo step',`q().history.stack.undo.length===${historyLength+1}`);
    if (!selected) {
      await input(' English');
      await check('typing immediately after whole-document conversion stays Latin and bold',`q().getText().startsWith('English vtZ English tail') && q().getFormat(11,8).font!=='krutidev' && q().getFormat(11,8).bold`);
      await evaluate('q().history.undo()');
      await check('undoing subsequent typing retains whole-document conversion',`JSON.stringify(q().getContents())===${JSON.stringify(converted)}`);
    }
    await evaluate('q().history.undo()');
    await check(mode+' undo restores exact original text and formatting',`JSON.stringify(q().getContents())===${JSON.stringify(original)}`);
    await evaluate('q().history.redo()');
    await check(mode+' redo restores exact converted text and formatting',`JSON.stringify(q().getContents())===${JSON.stringify(converted)}`);
    // Redo may restore a different cursor; repeat conversion at a collapsed caret
    // to check idempotence and pending typing font in whole-document mode.
    if (!selected) {
      await evaluate(`q().setSelection(11,0,'user');q().blur()`);
      await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Convert Font')).click()`);
      await sleep(150);
      await check('repeated whole-document conversion keeps bytes and undo history',`JSON.stringify(q().getContents())===${JSON.stringify(converted)} && q().history.stack.undo.length===${historyLength+1}`);
      await evaluate(`q().focus();q().setSelection(11,0,'silent')`);
      await input(' English');
      await check('whole-document conversion leaves future English typing Latin',`q().getText().startsWith('English vtZ English tail') && q().getFormat(11,8).font!=='krutidev' && !q().root.style.fontFamily`);
    }
    await evaluate(`window.dispatchEvent(new Event('pagehide'))`);
    const persisted = await evaluate('JSON.stringify(q().getContents())');
    await send('Page.reload');
    for(let i=0;i<100;i++){if(await evaluate(`!!document.querySelector('.ql-editor') && q().getText().includes('vtZ')`))break;await sleep(50);}
    await check(mode+' autosave reload preserves exact mixed text and formatting',`JSON.stringify(q().getContents())===${JSON.stringify(persisted)} && !q().root.style.fontFamily`);
  }
  // Seed an old root-font autosave in this disposable browser only.
  await evaluate(`window.dispatchEvent(new Event('pagehide'));localStorage.setItem('autosave_'+owner,'<h2><strong>ueLrs</strong></h2><p><span class="ql-font-arial">English</span></p>');localStorage.setItem('autosave_font_'+owner,JSON.stringify({version:1,html:localStorage.getItem('autosave_'+owner),fontFamily:'KrutiDev, sans-serif'}))`);
  await send('Page.reload');
  for(let i=0;i<100;i++){if(await evaluate(`!!document.querySelector('.ql-editor') && q().getText().includes('ueLrs')`))break;await sleep(50);}
  await check('historical root-font document keeps legacy glyphs, explicit English font and heading',`q().getText()==='ueLrs\\nEnglish\\n' && q().getFormat(0,1).font==='krutidev' && q().getFormat(0,1).bold && q().getFormat(0,1).header===2 && q().getFormat(6,1).font==='arial' && !q().root.style.fontFamily`);
  await evaluate(`q().focus();q().setSelection(5,0,'user')`);await input(' Latin');
  await check('new typing in historical legacy draft defaults to Latin',`q().getText().startsWith('ueLrs Latin') && q().getFormat(5,6).font!=='krutidev' && q().getFormat(0,1).font==='krutidev'`);
  await evaluate(`window.dispatchEvent(new Event('pagehide'))`);
  const saved=await evaluate('JSON.stringify(q().getContents())');
  await send('Page.reload');
  for(let i=0;i<100;i++){if(await evaluate(`!!document.querySelector('.ql-editor') && q().getText().includes('Latin')`))break;await sleep(50);}
  await check('reload preserves mixed text and all formatting after autosave',`JSON.stringify(q().getContents())===${JSON.stringify(saved)}`);
  await evaluate(`window.dispatchEvent(new Event('pagehide'));localStorage.setItem('autosave_'+owner,'<p><br></p>');localStorage.setItem('autosave_font_'+owner,JSON.stringify({version:1,html:'<p><br></p>',fontFamily:'KrutiDev, sans-serif'}))`);
  await send('Page.reload');
  for(let i=0;i<100;i++){if(await evaluate(`!!document.querySelector('.ql-editor') && q().getText()==='\\n'`))break;await sleep(50);}
  await check('empty historical autosave restores a Latin placeholder without invented content',`q().getText()==='\\n' && !q().root.style.fontFamily && !getComputedStyle(q().root,'::before').fontFamily.includes('KrutiDev')`);
  if(JSON.stringify(requests.map(r=>r.text))!==JSON.stringify(['नमस्ते','अर्ज','अर्ज','मराठी']) || paths.some(p=>p.includes('transliterat')))throw Error('Unexpected conversion/transliteration request');
  console.log(`${results.filter(r=>r.pass).length} PASS; ${results.filter(r=>!r.pass).length} FAIL`);
  if(results.some(r=>!r.pass))throw Error('Browser regression failure');
} catch(error) { console.error(error.message); process.exitCode=1; }
finally { ws?.close(); chrome?.kill(); server.close(); }
