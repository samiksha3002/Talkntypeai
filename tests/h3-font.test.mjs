import test from 'node:test';
import assert from 'node:assert/strict';
import Delta from 'quill-delta';
import {conversionUnavailable} from '../utils/legacyFontSupport.js';
import {convertFontDelta,convertEditorFont,requestFontConversion} from '../src/Editor/fontConversion.js';
import fontRouter from '../routes/fontConvert.js';
import {convert,SUPPORTED_CONVERSIONS} from '../utils/fontConverterUtils.js';
const clone=x=>JSON.parse(JSON.stringify(x));
function quill(delta){return {delta:clone(delta),range:{index:0,length:0},root:{style:{}},writes:0,history:{cutoff(){}},getContents(){return new Delta(clone(this.delta).ops)},getSelection(){return this.range},getFormat(range){return this.getContents().slice(Math.max(0,range.index-1),Math.max(1,range.index)).ops[0]?.attributes || {}},format(name,value){this.typingFormat={...this.typingFormat,[name]:value}},getLength(){return this.delta.ops.reduce((n,op)=>n+(typeof op.insert==='string'?op.insert.length:1),0)},setContents(d){this.delta=clone(d);this.writes++},updateContents(d){this.delta=clone(this.getContents().compose(d));this.writes++},setSelection(index,length){this.range={index,length}}}}
const words='\u0928\u092e\u0938\u094d\u0924\u0947';
test('H3 whitespace-only Delta operations make zero requests and preserve attributes',async()=>{const delta={ops:[{insert:'\n',attributes:{align:'center'}},{insert:' \t\u00a0\n\n'}]};const r=await convertFontDelta(delta,'test',()=>assert.fail('whitespace request'));assert.deepEqual(r.delta,delta)});
test('H3 meaningful text converts while separate paragraph/list formatting survives',async()=>{const delta={ops:[{insert:words,attributes:{bold:true}},{insert:'\n',attributes:{header:2}},{insert:'\n'},{insert:words,attributes:{italic:true}},{insert:'\n',attributes:{list:'bullet'}}]};const calls=[];const r=await convertFontDelta(delta,'unicode-to-krutidev',async text=>{calls.push(text);return 'ueLrs'});assert.equal(calls.length,1);assert.deepEqual(r.delta.ops.map(op=>op.attributes),delta.ops.map(op=>op.attributes));assert.equal(r.delta.ops.map(op=>op.insert).join(''),'ueLrs\n\nueLrs\n')});
test('H3 newlines inside a styled text op are preserved without sending them',async()=>{const calls=[];const r=await convertFontDelta({ops:[{insert:'one\n\ntwo\n',attributes:{bold:true}}]},'test',async text=>{calls.push(text);return text.toUpperCase()});assert.deepEqual(calls,['one','two']);assert.equal(r.delta.ops.map(op=>op.insert).join(''),'ONE\n\nTWO\n');assert.ok(r.delta.ops.every(op=>op.attributes.bold))});
test('H3 leading, trailing and interior whitespace including NBSP survive normalization',async()=>{const text=' \tfirst\u00a0\u00a0second  \t';const r=await convertFontDelta({ops:[{insert:text}]},'test',async core=>core.replace(/\u00a0/g,' '));assert.equal(r.delta.ops[0].insert,text)});
test('H3 embeds and mixed inline attributes are copied without mutation',async()=>{const delta={ops:[{insert:'one',attributes:{bold:true,color:'#123456'}},{insert:{image:'synthetic-image'},attributes:{width:'20'}},{insert:'two',attributes:{italic:true}},{insert:'\n',attributes:{align:'right',indent:1}}]};const original=clone(delta);const r=await convertFontDelta(delta,'test',async text=>text);assert.deepEqual(r.delta,delta);assert.deepEqual(delta,original);assert.notEqual(r.delta.ops[1].insert,delta.ops[1].insert)});
test('H3 empty delta is harmless',async()=>{assert.deepEqual((await convertFontDelta({ops:[]},'test',()=>assert.fail())).delta,{ops:[]})});
test('H3 malformed/empty/paragraph-changing responses never commit partial conversion',async()=>{for(const output of [undefined,'','\n','bad\ntext']){const q=quill({ops:[{insert:'first\nsecond\n'}]});const before=q.getContents();await assert.rejects(convertEditorFont(q,'test',async()=>output));assert.equal(q.writes,0);assert.deepEqual(q.getContents(),before)}});
test('H3 in-flight user typing/dictation is retained and stale conversion rejected',async()=>{const q=quill({ops:[{insert:'original\n'}]});await assert.rejects(convertEditorFont(q,'test',async()=>{q.delta={ops:[{insert:'new typing\n'}]};return 'converted'}),/document changed/);assert.equal(q.writes,0);assert.equal(q.delta.ops[0].insert,'new typing\n')});
test('H3 canceled or superseded conversion cannot overwrite editor',async()=>{const q=quill({ops:[{insert:'first\n'}]});assert.equal(await convertEditorFont(q,'test',async()=> 'changed',{isCurrent:()=>false}),false);assert.equal(q.writes,0)});
test('H3 conversion restores selection and applies legacy font only to converted text',async()=>{const q=quill({ops:[{insert:words},{insert:'\n',attributes:{align:'center'}}]});q.range={index:0,length:words.length};assert.equal(await convertEditorFont(q,'unicode-to-krutidev',async()=> 'ueLrs'),true);assert.deepEqual(q.range,{index:0,length:5});assert.equal(q.delta.ops[1].attributes.align,'center');assert.equal(q.delta.ops[0].attributes.font,'krutidev');assert.equal(q.root.style.fontFamily,undefined)});

test('Kruti placeholder and legitimate English are never submitted or given a legacy font',async()=>{
  for(const text of ['\n','Start Typing\n','Start typing or speaking...\n','English agreement\n']){
    const q=quill({ops:[{insert:text,attributes:{bold:true}}]});q.range={index:0,length:text.length-1};const before=q.getContents();
    assert.equal(await convertEditorFont(q,'unicode-to-krutidev',()=>assert.fail('English/placeholder request')),false);
    assert.deepEqual(q.getContents(),before);assert.equal(q.writes,0);assert.equal(q.root.style.fontFamily,undefined);
  }
});

test('Kruti converts selected Devanagari only, retaining mixed English, formatting and caret',async()=>{
  const q=quill({ops:[{insert:'Start Typing '+words+' '+words,attributes:{bold:true,color:'#123456'}},{insert:'\n',attributes:{align:'center'}}]});
  q.range={index:13,length:words.length};const calls=[];
  await convertEditorFont(q,'unicode-to-krutidev',async text=>{calls.push(text);return 'ueLrs'});
  assert.deepEqual(calls,[words]);assert.equal(q.delta.ops.map(op=>op.insert).join(''),'Start Typing ueLrs '+words+'\n');
  assert.deepEqual(q.range,{index:13,length:5});assert.equal(q.delta.ops[0].attributes.font,undefined);
  assert.deepEqual(q.delta.ops[1].attributes,{bold:true,color:'#123456',font:'krutidev'});
  assert.equal(q.delta.ops.at(-1).attributes.align,'center');assert.equal(q.root.style.fontFamily,undefined);
});

test('Kruti selected conversion rejects an in-flight edit',async()=>{
  const q=quill({ops:[{insert:'English '+words+'\n'}]});q.range={index:8,length:words.length};
  await assert.rejects(convertEditorFont(q,'unicode-to-krutidev',async()=>{q.delta={ops:[{insert:'new typing\n'}]};return 'ueLrs'}),/document changed/);
  assert.equal(q.writes,0);assert.equal(q.delta.ops[0].insert,'new typing\n');
});

test('Kruti supports the remembered selection after toolbar blur',async()=>{
  const q=quill({ops:[{insert:'Start Typing '+words+' English '+words+'\n',attributes:{italic:true}}]});
  q.range=null;const calls=[];
  await convertEditorFont(q,'unicode-to-krutidev',async text=>{calls.push(text);return 'ueLrs'},{fallbackRange:{index:13,length:words.length}});
  assert.deepEqual(calls,[words]);assert.equal(q.delta.ops.map(op=>op.insert).join(''),'Start Typing ueLrs English '+words+'\n');
  const old=quill({ops:[{insert:words+'\n'}]});old.range={index:0,length:words.length};old.root.style.fontFamily='KrutiDev, sans-serif';
  await convertEditorFont(old,'unicode-to-krutidev',async()=> 'ueLrs');assert.equal(old.root.style.fontFamily,'KrutiDev, sans-serif');
});

test('Kruti collapsed or absent selection converts all Devanagari, maps caret and defaults future typing to Latin',async()=>{
  for(const mode of ['caret','blurred','absent']){
    const q=quill({ops:[{insert:'English ',attributes:{italic:true}},{insert:'अर्ज',attributes:{bold:true}},{insert:' tail मराठी'},{insert:'\n',attributes:{align:'right'}}]});
    q.range=mode==='caret'?{index:12,length:0}:null;
    const calls=[];
    await convertEditorFont(q,'unicode-to-krutidev',async(text,type)=>{calls.push(text);return convert(type,text)},mode==='blurred'?{fallbackRange:{index:12,length:0}}:{});
    assert.deepEqual(calls,['अर्ज','मराठी']);
    assert.equal(q.delta.ops.map(op=>op.insert).join(''),'English vtZ tail ejkBh\n');
    assert.equal(q.delta.ops[0].attributes.font,undefined);
    assert.deepEqual(q.delta.ops[1].attributes,{bold:true,font:'krutidev'});
    assert.equal(q.delta.ops.at(-1).attributes.align,'right');
    assert.deepEqual(q.range,{index:mode==='absent'?0:11,length:0});
    if(mode!=='absent')assert.equal(q.typingFormat.font,false);
    assert.equal(q.root.style.fontFamily,undefined);
    const saved=q.getContents(),writes=q.writes;
    assert.equal(await convertEditorFont(q,'unicode-to-krutidev',()=>assert.fail('already converted')),false);
    assert.deepEqual(q.getContents(),saved);assert.equal(q.writes,writes);
  }
});

test('Kruti whole-document failure, cancellation and in-flight edits never commit a partial conversion',async()=>{
  for(const mode of ['failure','cancel','edit']){
    const q=quill({ops:[{insert:'English अर्ज tail मराठी\n'}]});q.range={index:12,length:0};
    const before=q.getContents();let calls=0;
    const request=async(text,type)=>{calls++;if(calls===2){if(mode==='failure')throw Error('offline');if(mode==='edit')q.delta={ops:[{insert:'new English typing\n'}]}}return convert(type,text)};
    q.history.cutoff=()=>assert.fail('history touched');
    if(mode==='cancel')assert.equal(await convertEditorFont(q,'unicode-to-krutidev',request,{isCurrent:()=>false}),false);
    else await assert.rejects(convertEditorFont(q,'unicode-to-krutidev',request),mode==='failure'?/offline/:/document changed/);
    assert.equal(q.writes,0);assert.deepEqual(q.range,{index:12,length:0});
    assert.deepEqual(q.getContents(),mode==='edit'?new Delta([{insert:'new English typing\n'}]):before);
  }
});

test('Kruti failure and cancellation leave the document, selection and history untouched',async()=>{
  for(const mode of ['failure','cancel']){
    const q=quill({ops:[{insert:words+'\n'}]});q.range={index:0,length:words.length};
    q.history.cutoff=()=>assert.fail('history touched');const before=q.getContents(),range=clone(q.range);
    if(mode==='failure')await assert.rejects(convertEditorFont(q,'unicode-to-krutidev',async()=>{throw Error('offline')}),/offline/);
    else assert.equal(await convertEditorFont(q,'unicode-to-krutidev',async()=> 'ueLrs',{isCurrent:()=>false}),false);
    assert.deepEqual(q.getContents(),before);assert.deepEqual(q.range,range);assert.equal(q.writes,0);
  }
});

test('Kruti selection cannot split a Devanagari grapheme',async()=>{
  const q=quill({ops:[{insert:words+'\n'}]});q.range={index:3,length:1};
  await assert.rejects(convertEditorFont(q,'unicode-to-krutidev',()=>assert.fail('split selection request')),/character cluster/);
  assert.equal(q.writes,0);
});

test('unavailable Preeti fails before conversion or mutation and retains saved document',async()=>{
  const q=quill({ops:[{insert:words+'\n',attributes:{bold:true}}]});const before=q.getContents();
  await assert.rejects(convertEditorFont(q,'unicode-to-preeti',()=>assert.fail('Preeti request')),/font asset.*not been verified/);
  assert.deepEqual(q.getContents(),before);assert.equal(q.writes,0);
});
test('H3 existing font API still rejects whitespace, helper only submits meaningful text',async()=>{const route=fontRouter.stack.find(l=>l.route?.path==='/convert').route.stack[0].handle;const invoke=body=>{const res={statusCode:200,status(n){this.statusCode=n;return this},json(b){this.body=b}};route({body},res);return res};assert.equal(invoke({text:'\n',conversionType:'unicode-to-krutidev'}).statusCode,400);const calls=[];const request=(text,type)=>requestFontConversion('http://127.0.0.1',text,type,{fetcher:async(url,options)=>{assert.equal(url,'http://127.0.0.1/api/font/convert');const body=JSON.parse(options.body);calls.push(body.text);const res=invoke(body);return {ok:res.statusCode===200,headers:{get:()=> 'application/json'},json:async()=>res.body}}});const r=await convertFontDelta({ops:[{insert:words},{insert:'\n\n'}]},'unicode-to-krutidev',request);assert.deepEqual(calls,[words]);assert.equal(r.delta.ops.map(op=>op.insert).join(''),'ueLrs\n\n')});
test('H3 all existing supported mappings remain callable; KrutiDev sample round-trips',async()=>{for(const type of Object.keys(SUPPORTED_CONVERSIONS).filter(type=>!conversionUnavailable(type))){const text=type==='krutidev-to-unicode'?'ueLrs':type==='shivaji-to-unicode'?'k':words;const r=await convertFontDelta({ops:[{insert:text},{insert:'\n'}]},type,async(s,t)=>convert(t,s));assert.equal(typeof r.delta.ops[0].insert,'string');assert.equal(r.delta.ops[1].insert,'\n')}assert.equal(convert('krutidev-to-unicode',convert('unicode-to-krutidev',words)),words)});
test('H3 network and non-JSON HTTP failures reject without a successful conversion',async()=>{await assert.rejects(requestFontConversion('http://127.0.0.1','x','test',{fetcher:async()=>{throw Error('offline')}}),/offline/);await assert.rejects(requestFontConversion('http://127.0.0.1','x','test',{fetcher:async()=>({headers:{get:()=> 'text/html'}})}),/non-JSON/)});

test('H3 literal angle-bracket text cannot be consumed as HTML by forward converters',async()=>{const text=words+' <'+words+'> '+words;const r=await convertFontDelta({ops:[{insert:text},{insert:'\n'}]},'unicode-to-krutidev',async(s,t)=>convert(t,s));assert.equal(r.delta.ops.map(op=>op.insert).join(''),'ueLrs <ueLrs> ueLrs\n')});
test('H3 formatting inside a Unicode grapheme fails safely before any request or mutation',async()=>{const q=quill({ops:[{insert:'\u0915',attributes:{bold:true}},{insert:'\u093f\n'}]});await assert.rejects(convertEditorFont(q,'unicode-to-krutidev',()=>assert.fail('split grapheme request')),/character cluster/);assert.equal(q.writes,0);assert.deepEqual(q.delta.ops,[{insert:'\u0915',attributes:{bold:true}},{insert:'\u093f\n'}])});
