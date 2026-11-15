import test from 'node:test';
import assert from 'node:assert/strict';
import { readEditorAutosave, writeEditorAutosave, createEditorAutosave, restoreEditorAutosave, bindEditorAutosaveLifecycle } from '../src/Editor/editorAutosave.js';
const storage = () => { const rows = new Map(); return { getItem:k=>rows.get(k) ?? null, setItem:(k,v)=>rows.set(k,v), removeItem:k=>rows.delete(k) }; };
test('existing HTML and Unicode autosaves are read exactly without writes or font guessing', () => {
 const s=storage();const html='<p><b>\u0928\u092e\u0938\u094d\u0924\u0947 English ueLrs</b></p><p><br></p>';
 s.setItem('autosave_a',html);s.setItem=()=>assert.fail('read must not write');s.removeItem=()=>assert.fail('read must not remove');
 assert.deepEqual(readEditorAutosave(s,'a'),{html,fontFamily:''});
 assert.deepEqual(readEditorAutosave(s,undefined),{html:'',fontFamily:''});
});
test('all supported root fonts survive exact HTML roundtrip without changing legacy text or formatting', () => {
 for(const font of ['KrutiDev','Shivaji01','Preeti']) { const s=storage();const html='<h2><b>ueLrs</b></h2><p></p>';
 writeEditorAutosave(s,'a',html,`"${font}", sans-serif`);assert.equal(s.getItem('autosave_a'),html);
 assert.deepEqual(readEditorAutosave(s,'a'),{html,fontFamily:`${font}, sans-serif`});
 assert.deepEqual(readEditorAutosave(s,'b'),{html:'',fontFamily:''}); }
});
test('stale malformed unknown or unapproved metadata never replaces HTML or applies a font', () => {
 const s=storage();const html='<p>Unicode unchanged</p>';s.setItem('autosave_a',html);
 for(const value of ['not json',JSON.stringify({version:1,html:'different',fontFamily:'KrutiDev, sans-serif'}),JSON.stringify({version:2,html,fontFamily:'KrutiDev, sans-serif'}),JSON.stringify({version:1,html,fontFamily:'arbitrary CSS'})]) {
 s.setItem('autosave_font_a',value);assert.deepEqual(readEditorAutosave(s,'a'),{html,fontFamily:''});assert.equal(s.getItem('autosave_a'),html); }
});
test('Unicode/default save clears old root metadata and preserves other owners', () => {
 const s=storage();writeEditorAutosave(s,'a','<p>ueLrs</p>','KrutiDev, sans-serif');writeEditorAutosave(s,'b','<p>other</p>','Preeti, sans-serif');
 const html='<p>\u0928\u092e\u0938\u094d\u0924\u0947 English</p>';writeEditorAutosave(s,'a',html,'');
 assert.equal(s.getItem('autosave_font_a'),null);assert.deepEqual(readEditorAutosave(s,'a'),{html,fontFamily:''});assert.equal(readEditorAutosave(s,'b').fontFamily,'Preeti, sans-serif');
});
test('older-client HTML overwrite cannot inherit metadata for different content', () => {
 const s=storage();writeEditorAutosave(s,'a','<p>ueLrs</p>','KrutiDev, sans-serif');s.setItem('autosave_a','<p>English replacement</p>');
 assert.deepEqual(readEditorAutosave(s,'a'),{html:'<p>English replacement</p>',fontFamily:''});
});

function setup(ownerId, options = {}) {
 const main=storage(),recovery=storage(),statuses=[],timers=new Map();let serial=0;
 const initial={html:'<p>Last saved</p>',fontFamily:''};writeEditorAutosave(main,ownerId,initial.html,'');
 const controller=createEditorAutosave({storage:()=>main,recoveryStorage:()=>recovery,ownerId,initial,onStatus:s=>statuses.push(s),
   schedule:fn=>{const id=++serial;timers.set(id,fn);return id},cancel:id=>timers.delete(id),...options});
 return {main,recovery,statuses,timers,controller};
}

test('rapid navigation/unmount flushes latest formatted snapshot before debounce fires',()=>{
 const {main,controller,timers,statuses}=setup('rapid');const html='<h2><strong>मराठी अर्ज English</strong></h2><p><br></p>';
 controller.stage(html);assert.equal(timers.size,1);assert.equal(statuses.at(-1),'pending');
 controller.dispose();assert.equal(timers.size,0);assert.equal(readEditorAutosave(main,'rapid').html,html);assert.equal(statuses.at(-1),'saved');
});

test('pagehide, hidden visibility and immediate refresh flush the latest content and font',()=>{
 const {main,controller}=setup('lifecycle'),win=new EventTarget(),doc=new EventTarget();doc.visibilityState='visible';
 const unbind=bindEditorAutosaveLifecycle(controller,win,doc);
 for(const event of ['pagehide','visibilitychange','beforeunload']){
   const html='<p><em>'+event+'</em></p>';controller.stage(html,'KrutiDev, sans-serif');
   if(event==='visibilitychange'){doc.visibilityState='hidden';doc.dispatchEvent(new Event(event))}else win.dispatchEvent(new Event(event,{cancelable:true}));
   assert.deepEqual(readEditorAutosave(main,'lifecycle'),{html,fontFamily:'KrutiDev, sans-serif'});
 }
 unbind();
});

test('quota failures retain old saved HTML, warn honestly and recover latest work by owner',()=>{
 const {main,recovery,controller,statuses}=setup('quota');const original=main.setItem;
 main.setItem=()=>{throw Error('quota')};controller.stage('<p><strong>Unsaved हिंदी</strong></p>','KrutiDev, sans-serif');
 assert.equal(controller.flush(),false);assert.equal(statuses.at(-1),'error');assert.equal(controller.dirty,true);
 assert.equal(main.getItem('autosave_quota'),'<p>Last saved</p>');
 const restored=restoreEditorAutosave({storage:()=>main,recoveryStorage:()=>recovery,ownerId:'quota'});
 assert.equal(restored.recovered,true);assert.equal(restored.html,'<p><strong>Unsaved हिंदी</strong></p>');
 assert.equal(restoreEditorAutosave({storage:()=>main,recoveryStorage:()=>recovery,ownerId:'someone-else'}).html,'');
 main.setItem=original;assert.equal(controller.flush(),true);assert.equal(statuses.at(-1),'saved');assert.equal(recovery.getItem('tnt_editor_recovery_quota'),null);
});

test('failed page departure requests a browser warning instead of false saved status',()=>{
 const {main,controller}=setup('departure'),win=new EventTarget(),doc=new EventTarget();
 main.setItem=()=>{throw Error('blocked')};controller.stage('<p>new work</p>');
 const unbind=bindEditorAutosaveLifecycle(controller,win,doc),event=new Event('beforeunload',{cancelable:true});Object.defineProperty(event,'returnValue',{value:'',writable:true});
 win.dispatchEvent(event);assert.equal(event.defaultPrevented,true);assert.equal(controller.dirty,true);unbind();
});

test('metadata failure cannot replace last good document; retry preserves font metadata',()=>{
 const {main,controller}=setup('metadata');const original=main.setItem;
 main.setItem=(key,value)=>{if(key==='autosave_font_metadata')throw Error('metadata quota');original(key,value)};
 controller.stage('<p>legacy new text</p>','Shivaji01, sans-serif');assert.equal(controller.flush(),false);
 assert.equal(main.getItem('autosave_metadata'),'<p>Last saved</p>');main.setItem=original;
 assert.equal(controller.flush(),true);assert.equal(readEditorAutosave(main,'metadata').fontFamily,'Shivaji01, sans-serif');
});

test('unknown initial saved state pauses writes and never replaces unread customer work',()=>{
 const main=storage(),recovery=storage();main.setItem('autosave_unread','<p>Existing customer work</p>');const get=main.getItem;
 main.getItem=()=>{throw Error('read denied')};const initial=restoreEditorAutosave({storage:()=>main,recoveryStorage:()=>recovery,ownerId:'unread'});
 assert.equal(initial.readError,true);main.getItem=get;
 const c=createEditorAutosave({storage:()=>main,recoveryStorage:()=>recovery,ownerId:'unread',initial});c.stage('<p>recent work</p>');
 assert.equal(c.flush(),false);assert.equal(main.getItem('autosave_unread'),'<p>Existing customer work</p>');c.dispose();
});

test('account changes cannot redirect old work into another owner autosave',()=>{
 const {main,controller}=setup('owner-a',{canWrite:()=>false});main.setItem('autosave_owner-b','<p>Owner B</p>');
 controller.stage('<p>Owner A unsaved</p>');assert.equal(controller.flush(),false);
 assert.equal(main.getItem('autosave_owner-a'),'<p>Last saved</p>');assert.equal(main.getItem('autosave_owner-b'),'<p>Owner B</p>');controller.dispose();
});

test('unchanged mount does not write or clear an existing saved draft',()=>{
 const {main,controller,statuses}=setup('unchanged');main.setItem=()=>assert.fail('unexpected write');main.removeItem=()=>assert.fail('unexpected delete');
 controller.stage('<p>Last saved</p>','');controller.dispose();assert.deepEqual(statuses,[]);
});

test('stale session recovery cannot overwrite a newer successful saved document',()=>{
 const main=storage(),recovery=storage();main.setItem('autosave_stale','<p>Newer saved</p>');
 recovery.setItem('tnt_editor_recovery_stale',JSON.stringify({version:1,html:'Old unsaved',fontFamily:'',baseHtml:'Old saved'}));
 const result=restoreEditorAutosave({storage:()=>main,recoveryStorage:()=>recovery,ownerId:'stale'});
 assert.equal(result.html,'<p>Newer saved</p>');assert.equal(result.recovered,false);
});

test('a blocked HTML write does not remove last-good legacy font metadata',()=>{
 const main=storage();writeEditorAutosave(main,'font-safe','<p>ueLrs</p>','KrutiDev, sans-serif');
 const set=main.setItem;main.setItem=(key,value)=>{if(key==='autosave_font-safe')throw Error('quota');set(key,value)};
 assert.throws(()=>writeEditorAutosave(main,'font-safe','<p>Unicode edit</p>',''),/quota/);
 assert.deepEqual(readEditorAutosave(main,'font-safe'),{html:'<p>ueLrs</p>',fontFamily:'KrutiDev, sans-serif'});
});

test('session-only recovery survives a fresh controller and preserves formatting',()=>{
 const main=storage(),recovery=storage();main.setItem('autosave_session-only','<p>Last saved</p>');
 const html='<h2><strong>हिंदी मराठी</strong></h2><p><br></p>';
 recovery.setItem('tnt_editor_recovery_session-only',JSON.stringify({version:1,html,fontFamily:'',baseHtml:'<p>Last saved</p>'}));
 const initial=restoreEditorAutosave({storage:()=>main,recoveryStorage:()=>recovery,ownerId:'session-only'});
 assert.equal(initial.recovered,true);assert.equal(initial.html,html);
 const c=createEditorAutosave({storage:()=>main,recoveryStorage:()=>recovery,ownerId:'session-only',initial});assert.equal(c.flush(),true);
 assert.equal(readEditorAutosave(main,'session-only').html,html);assert.equal(recovery.getItem('tnt_editor_recovery_session-only'),null);
});

test('unread font metadata preserves accessible HTML and pauses saving rather than guessing its font',()=>{
 const main=storage(),recovery=storage();main.setItem('autosave_metadata-read','<p>Existing legacy bytes</p>');const get=main.getItem;
 main.getItem=key=>{if(key==='autosave_font_metadata-read')throw Error('denied');return get(key)};
 const initial=restoreEditorAutosave({storage:()=>main,recoveryStorage:()=>recovery,ownerId:'metadata-read'});
 assert.equal(initial.html,'<p>Existing legacy bytes</p>');assert.equal(initial.readError,true);
});

test('font-only unsaved changes remain recoverable even when HTML is unchanged',()=>{
 const {main,recovery,controller}=setup('font-only');main.setItem=()=>{throw Error('quota')};
 controller.stage('<p>Last saved</p>','KrutiDev, sans-serif');assert.equal(controller.flush(),false);
 const recovered=restoreEditorAutosave({storage:()=>main,recoveryStorage:()=>recovery,ownerId:'font-only'});
 assert.equal(recovered.recovered,true);assert.equal(recovered.fontFamily,'KrutiDev, sans-serif');
});
