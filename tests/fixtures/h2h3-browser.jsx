import {convertEditorFont} from '../../src/Editor/fontConversion.js';
import React from 'react';import {createRoot} from 'react-dom/client';import {BrowserRouter} from 'react-router-dom';import {Quill} from 'react-quill-new';import Dashboard from '../../src/components/Dashboard.jsx';
const results=JSON.parse(sessionStorage.getItem('release-results')||'[]');const record=(bug,name,pass)=>{const result={bug,name,pass:!!pass};results.push(result);sessionStorage.setItem('release-results',JSON.stringify(results));navigator.sendBeacon('/__record',new Blob([JSON.stringify(result)],{type:'application/json'}));};window.__audioOrder=[];window.__alerts=[];window.alert=message=>window.__alerts.push(message);
const nativeFetch=window.fetch;window.fetch=(input,options)=>{const url=new URL(input,location.href);if(url.origin!==location.origin)throw Error('External request blocked');return nativeFetch(input,options)};
Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}});
window.MediaRecorder=class extends EventTarget{constructor(){super();this.state='inactive'}start(){this.state='recording'}stop(){this.state='inactive';const e=new Event('dataavailable');Object.defineProperty(e,'data',{value:new Blob(['synthetic'])});this.dispatchEvent(e);this.dispatchEvent(new Event('stop'))}};
window.SpeechRecognition=class{start(){window.__recognition=this;this.onstart?.()}stop(){if(this.pendingFinal)this.onresult?.(this.pendingFinal);this.onend?.()}};
localStorage.setItem('user',JSON.stringify({_id:'000000000000000000000001',role:'user',subscription:{isActive:true}}));
let fixtureRoot=createRoot(document.getElementById('root'));
const mountDashboard=()=>fixtureRoot.render(<BrowserRouter><Dashboard/></BrowserRouter>);
mountDashboard();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const wait=async(fn)=>{const end=Date.now()+8000;while(Date.now()<end){if(fn())return;await sleep(30)}throw Error('wait timeout')};
const q=()=>Quill.find(document.querySelector('.ql-container'));
const click=part=>{const e=[...document.querySelectorAll('button')].find(b=>b.textContent.includes(part));if(!e)throw Error('missing control '+part);e.click()};
const dg=(text,start,is_final=true)=>({is_final,start,duration:1,channel:{alternatives:[{transcript:text}]}});
const webResult=(text,isFinal=true)=>Object.assign([{transcript:text}],{isFinal});
const setText=async(text)=>{q().setText(text,'user');q().setSelection(0,0);await sleep(50)};
const api=async(path,body)=>fetch(path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined).then(r=>r.json());
const report=()=>{document.body.innerHTML='<pre id="verification-result"></pre>';document.getElementById('verification-result').textContent=JSON.stringify(results)};
const remount=async()=>{fixtureRoot.unmount();fixtureRoot=createRoot(document.getElementById('root'));mountDashboard();await wait(()=>document.querySelector('.ql-editor'));await sleep(80)};
let phase='main';
(async()=>{try{
const reloadStage=sessionStorage.getItem('release-reload');
if(reloadStage){
 await wait(()=>document.querySelector('.ql-editor')&&q().getText()==='ueLrs\n');
 record('Release','real page reload '+reloadStage+' restores KrutiDev text and root font',q().root.style.fontFamily==='KrutiDev, sans-serif');
 if(reloadStage==='1'){sessionStorage.setItem('release-reload','2');location.reload();return;}
 for(const [name,html,text] of [
  ['English','<p><strong>English document</strong></p><p><br></p><p>Second paragraph</p>','English document\n\nSecond paragraph\n'],
  ['Unicode','<p><strong>\u0928\u092e\u0938\u094d\u0924\u0947</strong></p><p>English</p>','\u0928\u092e\u0938\u094d\u0924\u0947\nEnglish\n'],
  ['old inline KrutiDev','<p><strong><span class="ql-font-krutidev">ueLrs</span></strong></p>','ueLrs\n']
 ]){
  localStorage.setItem('autosave_000000000000000000000001',html);localStorage.removeItem('autosave_font_000000000000000000000001');
  await remount();record('Release',name+' old HTML autosave loads without inferred root font',q().getText()===text&&!q().root.style.fontFamily&&q().getFormat(0,3).bold===true);
  await remount();record('Release',name+' survives repeated reopen',q().getText()===text&&!q().root.style.fontFamily);
 }
 record('Release','old inline KrutiDev font attribute survives restore',q().getFormat(0,3).font==='krutidev');
 const language=document.querySelector('aside select');language.value='mr-IN';language.dispatchEvent(new Event('change',{bubbles:true}));await sleep(50);click('Start Speaking');await wait(()=>window.__recognition);
 q().setSelection(2,0);q().blur();window.__recognition.onresult({resultIndex:0,results:[webResult('voice')]});await wait(()=>q().getText().includes('voice'));
 record('Release','speech after reopen preserves text around remembered caret',q().getText()==='ue voice Lrs\n');click('Stop Speaking');report();return;
}

await wait(()=>document.querySelector('.ql-editor'));await sleep(80);await setText('');click('Start Speaking');await wait(()=>window.__emitDeepgram);
window.__emitDeepgram(dg('partial',0,false));await sleep(40);record('H2','interim provider result does not insert',q().getText()==='\n');
window.__emitDeepgram(dg('hello',0));window.__emitDeepgram(dg('hello',1));window.__emitDeepgram(dg('hello world',2));window.__emitDeepgram(dg('hello world',2));await wait(()=>q().getText().includes('world'));record('H2','batched identical utterances and prefix-sharing finals insert once each',q().getText()==='hello hello hello world\n');
q().setContents({ops:[{insert:'left ',attributes:{bold:true}},{insert:'right\n'}]},'user');q().setSelection(5,0);q().blur();await sleep(40);window.__emitDeepgram(dg('alpha new line beta new paragraph gamma comma delta full stop.',3));await wait(()=>q().getText().includes('delta'));record('H2','blurred caret and mixed commands preserve surrounding document',q().getText()==='left alpha\nbeta\n\ngamma, delta. right\n');record('H2','existing bold content survives dictation',q().getContents().ops[0].attributes.bold===true);
await setText('');window.__emitDeepgram(dg('commander semicolon court',4));await wait(()=>q().getText().includes('court'));record('H2','punctuation boundaries do not alter words or casing',q().getText()==='commander semicolon court\n');
window.__stopFinal=dg('last words',5);click('Stop Speaking');await wait(()=>q().getText().includes('last words'));record('H2','manual stop flushes final speech before provider closes',q().getText().includes('last words'));record('H2','final recorder data is sent before connection closes',window.__audioOrder.slice(-2).join(',')==='send,close');
const language=document.querySelector('aside select');language.value='mr-IN';language.dispatchEvent(new Event('change',{bubbles:true}));await sleep(50);click('Start Speaking');await wait(()=>window.__recognition);await setText('');const rec=window.__recognition;
rec.onresult({resultIndex:0,results:[webResult('unfinished',false)]});await sleep(20);record('H2','web interim transcript does not enter Quill',q().getText()==='\n');
const finals=[webResult('yes'),webResult('yes'),webResult('new line finished')];rec.onresult({resultIndex:0,results:finals});rec.onresult({resultIndex:0,results:finals});await wait(()=>q().getText().includes('finished'));record('H2','web batches and repeated finals preserve words without replay',q().getText()==='yes yes\nfinished\n');
rec.pendingFinal={resultIndex:3,results:[...finals,webResult('stop final')]};click('Stop Speaking');await wait(()=>q().getText().includes('stop final'));record('H2','native stop-time final transcript is retained',q().getText().includes('stop final'));
await setText('typed text');q().formatText(0,5,{bold:true},'user');await sleep(40);record('Editor','ordinary user typing and toolbar-equivalent formatting still work',q().getText()==='typed text\n'&&q().getFormat(0,5).bold===true);
const word='\u0928\u092e\u0938\u094d\u0924\u0947';q().setContents({ops:[{insert:word,attributes:{bold:true}},{insert:'\n',attributes:{header:2}},{insert:'\n'},{insert:word,attributes:{italic:true}},{insert:'\n',attributes:{align:'center'}}]},'user');await sleep(50);click('Convert Font');await wait(()=>q().getText().includes('ueLrs'));await sleep(50);
record('H3','conversion preserves blank paragraphs and text order',q().getText()==='ueLrs\n\nueLrs\n');const ops=q().getContents().ops;record('H3','real Quill retains bold italic heading and alignment',ops.some(op=>op.attributes?.bold)&&ops.some(op=>op.attributes?.italic)&&ops.some(op=>op.attributes?.header===2)&&ops.some(op=>op.attributes?.align==='center'));
const requests=await api('/__requests');record('H3','API receives no whitespace-only or newline requests',requests.length>0&&requests.every(r=>r.text.trim()&&!/[\r\n]/.test(r.text)));record('H3','repeated identical styled text shares one conversion request',requests.length===1);
q().insertText(q().getLength()-1,' ordinary typing','user');q().formatText(0,5,{underline:true},'user');await sleep(30);record('Editor','typing and formatting remain usable after conversion',q().getText().includes('ordinary typing')&&q().getFormat(0,5).underline===true);
// Release-only coverage: preserve the existing browser autosave across a dashboard remount.
const convertedText=q().getText();
const convertedFont=q().root.style.fontFamily;
await wait(()=>localStorage.getItem('autosave_000000000000000000000001')?.replaceAll('&nbsp;',' ').includes('ordinary typing'));
record('Release','converted editor HTML reaches existing local autosave',true);
fixtureRoot.unmount();
fixtureRoot=createRoot(document.getElementById('root'));mountDashboard();
await wait(()=>document.querySelector('.ql-editor')&&q().getText()===convertedText);
record('Release','dashboard remount restores converted text and inline formatting',q().getFormat(0,5).underline===true);
record('Release','dashboard remount retains converted legacy root font',!!convertedFont&&q().root.style.fontFamily===convertedFont);
await setText(word);
let release;const gate=new Promise(resolve=>{release=resolve});
const running=convertEditorFont(q(),'unicode-to-krutidev',async()=>{await gate;return 'ueLrs'});
q().insertText(0,'new typing ','user');const newer=JSON.stringify(q().getContents());release();
let rejected=false;try{await running}catch(error){rejected=error.message.includes('document changed')}
record('H3','async conversion refuses to overwrite newer Quill edits',rejected&&JSON.stringify(q().getContents())===newer);
// Exercise two actual document reloads, not just component remounts.
phase='convert before reload';await setText(word);click('Convert Font');await wait(()=>q().getText()==='ueLrs\n'&&q().root.style.fontFamily==='KrutiDev, sans-serif');
phase='persist before reload';await wait(()=>{const meta=JSON.parse(localStorage.getItem('autosave_font_000000000000000000000001')||'null');return meta?.html===localStorage.getItem('autosave_000000000000000000000001')&&meta?.fontFamily==='KrutiDev, sans-serif'&&(()=>{const saved=document.createElement('div');saved.innerHTML=meta.html;return saved.textContent==='ueLrs'})()});
sessionStorage.setItem('release-reload','1');location.reload();return;


}catch(e){record('Harness','completed: '+phase+' '+e.message+' '+JSON.stringify({text:document.querySelector('.ql-editor')&&q().getText(),font:document.querySelector('.ql-editor')&&q().root.style.fontFamily,alerts:window.__alerts}),false)}report()})();
