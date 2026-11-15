import { legacyFontUnavailable } from '../../utils/legacyFontSupport.js';
export const exportFonts = {
  'times-new-roman':'Times New Roman', 'courier-new':'Courier New', arial:'Arial',
  georgia:'Georgia', verdana:'Verdana', devanagari:'Nirmala UI', krutidev:'KrutiDev',
  KrutiDev:'KrutiDev', Shivaji01:'Shivaji01',
};
export function fontName(value, fallback='Times New Roman') {
  return exportFonts[value] || (/^[\w -]{1,80}$/.test(value||'') ? value : fallback);
}
export function fontPoints(value, fallback=12) {
  if(value==='small')return 9;if(value==='large')return 18;if(value==='huge')return 24;
  const match=/^(\d+(?:\.\d+)?)(px|pt)?$/.exec(String(value||''));
  if(!match)return fallback;
  return Math.max(6,Math.min(96,Number(match[1])*(match[2]==='px'?.75:1)));
}
export function deltaBlocks(delta) {
  if(!Array.isArray(delta?.ops))throw Error('The editor document could not be read.');
  const blocks=[];let runs=[];
  for(const op of delta.ops){
    if(typeof op.insert!=='string')throw Error('Export currently supports text documents. Remove images or unsupported embeds from a copy before exporting.');
    const pieces=op.insert.split('\n');
    for(let i=0;i<pieces.length;i++){
      if(pieces[i])runs.push({text:pieces[i],attributes:{...op.attributes}});
      if(i<pieces.length-1){blocks.push({runs,attributes:{...op.attributes}});runs=[];}
    }
  }
  if(runs.length||!blocks.length)blocks.push({runs,attributes:{}});
  return blocks;
}
export const blockText=block=>block.runs.map(run=>run.text).join('');
export function validateBlocks(blocks,{font}={}){
  if(!Array.isArray(blocks)||!blocks.length)throw Error('The document is empty or unavailable.');
  for (const family of [font, ...blocks.flatMap(block => block.runs.map(run => run.attributes?.font))]) {
    const unavailable = legacyFontUnavailable(family); if (unavailable) throw Error(unavailable);
  }
  for(const block of blocks){if(block.attributes?.['code-block']||block.attributes?.blockquote)throw Error('Code blocks and quotations require a reviewed export template. Convert them to paragraphs in a copy before exporting.');}
}
