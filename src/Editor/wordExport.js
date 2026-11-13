import {Document,Packer,Paragraph,TextRun,HeadingLevel,AlignmentType,LevelFormat} from 'docx';
import {fontName,fontPoints,validateBlocks} from './exportModel.js';

export async function wordBlob(blocks,{font='Times New Roman',size=12}={}){
  validateBlocks(blocks);
  let sequence=0,previousOrdered=false;const config=[];
  const children=blocks.map(block=>{
    const attrs=block.attributes||{},heading=Number(attrs.header)||0;
    const ordered=attrs.list==='ordered',indent=Math.max(0,Math.min(8,Number(attrs.indent)||0));
    if(ordered&&!previousOrdered){sequence++;config.push({reference:'ordered-'+sequence,levels:Array.from({length:9},(_,level)=>({level,format:LevelFormat.DECIMAL,text:'%'+(level+1)+'.',alignment:AlignmentType.START,style:{paragraph:{indent:{left:720*(level+1),hanging:360}}}}))});}
    previousOrdered=ordered;
    return new Paragraph({
      heading:heading?HeadingLevel['HEADING_'+Math.min(6,heading)]:undefined,
      alignment:({center:AlignmentType.CENTER,right:AlignmentType.RIGHT,justify:AlignmentType.JUSTIFIED})[attrs.align]||AlignmentType.LEFT,
      ...(ordered?{numbering:{reference:'ordered-'+sequence,level:indent}}:attrs.list?{bullet:{level:indent}}:{indent:{left:indent*720}}),
      spacing:{after:120,line:300},
      children:block.runs.length?block.runs.map(run=>{
        const a=run.attributes||{},points=fontPoints(a.size,heading?({1:24,2:20,3:16}[heading]||14):size);
        return new TextRun({text:run.text,bold:!!a.bold||!!heading,boldComplexScript:!!a.bold||!!heading,italics:!!a.italic,italicsComplexScript:!!a.italic,underline:a.underline?{}:undefined,strike:!!a.strike,
          size:Math.round(points*2),sizeComplexScript:Math.round(points*2),
          font:{ascii:fontName(a.font,font),hAnsi:fontName(a.font,font),cs:'Nirmala UI',eastAsia:'Nirmala UI'},
          ...(typeof a.color==='string'&&/^#[\da-f]{6}$/i.test(a.color)?{color:a.color.slice(1)}:{}),
          ...(typeof a.background==='string'&&/^#[\da-f]{6}$/i.test(a.background)?{shading:{fill:a.background.slice(1)}}:{}),
        });
      }):[new TextRun('')],
    });
  });
  return Packer.toBlob(new Document({numbering:{config},sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1134,bottom:1134,left:1134,right:1134}}},children}]}));
}
