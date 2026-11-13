import { PDFName, PDFHexString, beginText, endText, setFontAndSize, setTextMatrix, showText } from 'pdf-lib';

const utf16=value=>Array.from({length:value.length},(_,i)=>value.charCodeAt(i).toString(16).padStart(4,'0')).join('').toUpperCase();
// The visible page is rendered by the browser. These valid, blank Type3 glyphs
// carry a ToUnicode map for search/copy without redistributing a font binary.
export function addPdfTextLayer(pdf,pages){
  // One logical visual line per glyph avoids viewer heuristics inserting spaces
  // inside Devanagari clusters. Selection rectangles are consequently line-wide.
  pages=pages.map(page=>{
    const lines=new Map();
    for(const glyph of page.glyphs){
      const key=glyph.line??glyph.y;let line=lines.get(key);
      if(!line){line={...glyph,text:'',right:glyph.x};lines.set(key,line);}
      line.text+=glyph.text;line.right=Math.max(line.right,glyph.x+glyph.width);
      line.x=Math.min(line.x,glyph.x);line.y=Math.min(line.y,glyph.y);line.height=Math.max(line.height,glyph.height);
    }
    return {glyphs:[...lines.values()].map(line=>({...line,width:line.right-line.x}))};
  });
  const symbols=[...new Set(pages.flatMap(page=>page.glyphs.map(g=>g.text)))];
  const mapping=new Map();const context=pdf.context;
  for(let start=0;start<symbols.length;start+=200){
    const group=symbols.slice(start,start+200),procs={},differences=[0];
    const blank=context.register(context.flateStream('1000 0 d0\n'));
    group.forEach((text,index)=>{procs['g'+index]=blank;differences.push(PDFName.of('g'+index));});
    const entries=group.map((text,index)=>'<'+index.toString(16).padStart(2,'0')+'> <'+utf16(text)+'>');
    let cmap='/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (TNT) /Ordering (Unicode) /Supplement 0 >> def\n/CMapName /TNTUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n';
    for(let offset=0;offset<entries.length;offset+=100){const batch=entries.slice(offset,offset+100);cmap+=batch.length+' beginbfchar\n'+batch.join('\n')+'\nendbfchar\n';}
    cmap+='endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend';
    const font=context.register(context.obj({Type:'Font',Subtype:'Type3',Name:'TNTText',FontBBox:[0,0,1000,1000],FontMatrix:[.001,0,0,.001,0,0],CharProcs:context.obj(procs),Encoding:context.obj({Type:'Encoding',Differences:differences}),FirstChar:0,LastChar:group.length-1,Widths:group.map(()=>1000),Resources:context.obj({}),ToUnicode:context.register(context.flateStream(cmap))}));
    group.forEach((text,index)=>mapping.set(text,{font,code:index.toString(16).padStart(2,'0')}));
  }
  pages.forEach((record,index)=>{
    const page=pdf.getPage(index),names=new Map();
    for(const glyph of record.glyphs){
      const entry=mapping.get(glyph.text);let key=names.get(entry.font);
      if(!key){key=page.node.newFontDictionary('TNT',entry.font);names.set(entry.font,key);}
      page.pushOperators(beginText(),setFontAndSize(key,1),setTextMatrix(Math.max(.01,glyph.width)*.75,0,0,glyph.height*.75,glyph.x*.75,page.getHeight()-(glyph.y+glyph.height*.8)*.75),showText(PDFHexString.of(entry.code)),endText());
    }
  });
}
