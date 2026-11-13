import test from 'node:test';
import assert from 'node:assert/strict';
import { readEditorAutosave, writeEditorAutosave } from '../src/Editor/editorAutosave.js';
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
