import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';
import {fontName,fontPoints,validateBlocks} from './exportModel.js';
import {addPdfTextLayer} from './pdfTextLayer.js';

const WIDTH=794,HEIGHT=1123,MARGIN=76;
const segments=text=>[...new Intl.Segmenter('hi',{granularity:'grapheme'}).segment(text)].map(part=>({text:part.segment,start:part.index,end:part.index+part.segment.length}));
function paragraph(block,defaults,counters){
  const element=document.createElement('div'),a=block.attributes||{},heading=Number(a.header)||0;
  const indent=Math.max(0,Math.min(8,Number(a.indent)||0));
  Object.assign(element.style,{position:'relative',margin:'0',padding:'0',whiteSpace:'pre-wrap',overflowWrap:'anywhere',lineHeight:'1.5',textAlign:['center','right','justify'].includes(a.align)?a.align:'left',fontFamily:fontName(defaults.font)+', "Nirmala UI", "Noto Sans Devanagari", serif',fontSize:(heading?({1:24,2:20,3:16}[heading]||14):defaults.size)+'pt',fontWeight:heading?'bold':'normal',paddingLeft:(indent*24+(a.list?24:0))+'px'});
  if(a.list){
    const marker=document.createElement('span');
    if(a.list==='ordered'){counters[indent]=(counters[indent]||0)+1;counters.length=indent+1;marker.textContent=counters[indent]+'.';}else {counters.length=0;marker.textContent='\u2022';}
    Object.assign(marker.style,{position:'absolute',left:indent*24+'px'});element.appendChild(marker);
  }else counters.length=0;
  for(const run of block.runs){
    const span=document.createElement('span'),attrs=run.attributes||{};span.textContent=run.text;
    Object.assign(span.style,{fontFamily:fontName(attrs.font,defaults.font)+', "Nirmala UI", "Noto Sans Devanagari", serif',fontSize:fontPoints(attrs.size,heading?({1:24,2:20,3:16}[heading]||14):defaults.size)+'pt',fontWeight:attrs.bold||heading?'bold':'normal',fontStyle:attrs.italic?'italic':'normal',textDecoration:[attrs.underline?'underline':'',attrs.strike?'line-through':''].filter(Boolean).join(' ')});
    if(/^#[\da-f]{6}$/i.test(attrs.color||''))span.style.color=attrs.color;
    if(/^#[\da-f]{6}$/i.test(attrs.background||''))span.style.backgroundColor=attrs.background;
    element.appendChild(span);
  }
  if(!block.runs.length)element.appendChild(document.createElement('br'));
  return element;
}
export function measureExportLines(element){
  const rect=element.getBoundingClientRect(),glyphs=[];
  const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
    const node=walker.currentNode;
    for(const part of segments(node.textContent)){
      const range=document.createRange();range.setStart(node,part.start);range.setEnd(node,part.end);
      const box=range.getBoundingClientRect();
      if(box.width||part.text.trim())glyphs.push({...part,x:box.left,y:box.top,width:box.width,height:box.height});
    }
  }
  const lines=[];
  for(const glyph of glyphs){
    let line=lines.find(l=>glyph.y<l.bottom-1&&glyph.y+glyph.height>l.top+1);
    if(!line){line={top:glyph.y,bottom:glyph.y+glyph.height,glyphs:[]};lines.push(line);}
    line.glyphs.push(glyph);line.top=Math.min(line.top,glyph.y);line.bottom=Math.max(line.bottom,glyph.y+glyph.height);
  }
  lines.sort((a,b)=>a.top-b.top);
  if(!lines.length)return [{element,top:rect.top,height:rect.height+8,glyphs:[],rect}];
  return lines.map((line,index)=>{
    const top=index?(lines[index-1].bottom+line.top)/2:rect.top;
    const bottom=index<lines.length-1?(line.bottom+lines[index+1].top)/2:rect.bottom+8;
    return {element,rect,top,height:bottom-top,glyphs:line.glyphs};
  });
}
export async function pdfBlob(blocks,{font='Times New Roman',size=12,signal,onPage}={}){
  validateBlocks(blocks,{font});
  if(typeof Intl.Segmenter!=='function')throw Error('This browser needs an update to safely export Unicode PDF text.');
  const host=document.createElement('div');Object.assign(host.style,{position:'fixed',left:'-100000px',top:'0',width:WIDTH+'px',background:'white',color:'black',zIndex:'-1'});
  const measure=document.createElement('div');measure.style.width=WIDTH-2*MARGIN+'px';host.appendChild(measure);document.body.appendChild(host);
  try{
    const counters=[];for(const block of blocks)measure.appendChild(paragraph(block,{font,size},counters));
    // Force layout/font discovery before measuring or rasterizing legacy glyphs.
    measure.getBoundingClientRect();
    await document.fonts.ready;signal?.throwIfAborted();
    const units=[...measure.children].flatMap(measureExportLines),left=measure.getBoundingClientRect().left;
    const records=[];let record={units:[],glyphs:[],height:0};records.push(record);
    for(const unit of units){
      if(unit.height>HEIGHT-2*MARGIN)throw Error('A document line is taller than one export page. Reduce its font size.');
      if(record.height+unit.height>HEIGHT-2*MARGIN&&record.units.length){record={units:[],glyphs:[],height:0};records.push(record);}
      record.units.push(unit);
      record.glyphs.push(...unit.glyphs.map(g=>({line:record.units.length-1,text:g.text,x:MARGIN+g.x-left,y:MARGIN+record.height+g.y-unit.top,width:g.width,height:g.height})));
      record.height+=unit.height;
    }
    const pdf=await PDFDocument.create();
    for(let index=0;index<records.length;index++){
      signal?.throwIfAborted();const entry=records[index],page=document.createElement('div');
      Object.assign(page.style,{position:'relative',width:WIDTH+'px',height:HEIGHT+'px',background:'white',overflow:'hidden'});
      const content=document.createElement('div');Object.assign(content.style,{position:'absolute',left:MARGIN+'px',top:MARGIN+'px',width:WIDTH-2*MARGIN+'px'});page.appendChild(content);
      for(const unit of entry.units){
        const clip=document.createElement('div');Object.assign(clip.style,{position:'relative',height:unit.height+'px',overflow:'hidden'});
        const clone=unit.element.cloneNode(true);Object.assign(clone.style,{position:'absolute',top:unit.rect.top-unit.top+'px',width:'100%',boxSizing:'border-box'});clip.appendChild(clone);content.appendChild(clip);
      }
      host.appendChild(page);
      const canvas=await html2canvas(page,{scale:2,backgroundColor:'#ffffff',logging:false,useCORS:false,allowTaint:false,windowWidth:WIDTH,windowHeight:HEIGHT});
      try{const image=await pdf.embedPng(canvas.toDataURL('image/png'));pdf.addPage([WIDTH*.75,HEIGHT*.75]).drawImage(image,{x:0,y:0,width:WIDTH*.75,height:HEIGHT*.75});}
      finally{canvas.width=1;canvas.height=1;page.remove();}
      onPage?.(index+1,records.length);
    }
    signal?.throwIfAborted();addPdfTextLayer(pdf,records);
    return new Blob([await pdf.save()],{type:'application/pdf'});
  }finally{host.remove();}
}
