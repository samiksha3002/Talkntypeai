import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {conversionUnavailable} from '../utils/legacyFontSupport.js';
import {convert} from '../utils/fontConverterUtils.js';
import {convertEditorFont} from '../src/Editor/fontConversion.js';
import {validateBlocks} from '../src/Editor/exportModel.js';
import router from '../routes/fontConvert.js';
const invoke=(path,method,body={})=>{const response={code:200,status(code){this.code=code;return this},json(value){this.body=value}};router.stack.find(layer=>layer.route?.path===path&&layer.route.methods[method]).route.stack[0].handle({body},response);return response};
const samples=['नेपाल','मराठी अर्ज ळ','हिंदी आवेदन','किंमत क्षेत्र ज्ञान श्री कर्म प्रार्थना','१२३ ०९ ।, :; English\nStart Typing'];
test('unverified Preeti/Shivaji and Mangal aliases fail closed without guessing any sample',async()=>{
 for(const type of ['unicode-to-preeti','mangal-to-preeti','preeti-to-unicode','unicode-to-shivaji','mangal-to-shivaji','shivaji-to-unicode']){
   assert.ok(conversionUnavailable(type));for(const text of samples){assert.throws(()=>convert(type,text),/unavailable/);const result=invoke('/convert','post',{conversionType:type,text});assert.equal(result.code,503);assert.equal(result.body.success,false)}
   await assert.rejects(convertEditorFont({getContents:()=>assert.fail('document accessed')},type,()=>assert.fail('conversion request')),/unavailable/);
 }
});
test('capabilities do not advertise blocked conversions and named API paths cannot bypass guards',()=>{
 const capabilities=invoke('/supported','get');assert.ok(capabilities.body.supported.some(row=>row.id==='unicode-to-krutidev'));
 assert.ok(capabilities.body.supported.every(row=>!conversionUnavailable(row.id)));
 for(const path of ['/shivaji-to-unicode','/preeti-to-unicode'])assert.equal(invoke(path,'post',{text:'g]kfn kLvaavao'}).code,503);
});
test('Preeti/Shivaji exports reject unverified root and inline fonts without mutating saved blocks',()=>{
 for(const font of ['Preeti','Shivaji01','Shivaji02','Shivaji05','shivaji']){
   const blocks=[{runs:[{text:'Existing legacy bytes English',attributes:{font,bold:true}}],attributes:{align:'center'}}],before=JSON.stringify(blocks);
   assert.throws(()=>validateBlocks(blocks),/unavailable/);assert.throws(()=>validateBlocks([{runs:[{text:'old saved'}]}],{font}),/unavailable/);assert.equal(JSON.stringify(blocks),before);
 }
 assert.doesNotThrow(()=>validateBlocks([{runs:[{text:'ueLrs',attributes:{font:'krutidev'}}]}]));
});
test('exact bundled font is Shivaji01 Shusha 1.5, not an inferred interchangeable variant',()=>{
 const b=fs.readFileSync(new URL('../public/Shivaji01.ttf',import.meta.url));
 assert.equal(createHash('sha256').update(b).digest('hex'),'b5bfbdebdbf9bebb0a59c9720c0fa823a8847a7280b068aa2cf605aacdb3c7a2');
 const tables=new Map();for(let i=0;i<b.readUInt16BE(4);i++){const pos=12+i*16;tables.set(b.toString('ascii',pos,pos+4),b.readUInt32BE(pos+8))}
 const offset=tables.get('name'),count=b.readUInt16BE(offset+2),strings=offset+b.readUInt16BE(offset+4);const names=[];
 for(let i=0;i<count;i++){const pos=offset+6+i*12;if(b.readUInt16BE(pos)===3&&b.readUInt16BE(pos+6)===5){const start=strings+b.readUInt16BE(pos+10),size=b.readUInt16BE(pos+8);names.push(Buffer.from(b.subarray(start,start+size)).swap16().toString('utf16le'))}}
 assert.ok(names.includes('Shivaji01 - Shusha - Version 1.5 Sunday 25 May 1997'));assert.equal(b.readUInt16BE(tables.get('OS/2')+8),1);
});
