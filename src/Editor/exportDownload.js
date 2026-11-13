import {deltaBlocks,fontName,fontPoints} from './exportModel.js';

export function exportSnapshot(editor){
  if(!editor?.getContents)throw Error('The editor is not ready. Your document has not been changed.');
  const style=editor.root&&typeof getComputedStyle==='function'?getComputedStyle(editor.root):{};
  const family=(style.fontFamily||'Times New Roman').split(',')[0].replace(/["']/g,'').trim();
  return {blocks:deltaBlocks(editor.getContents()),defaults:{font:fontName(family),size:fontPoints(style.fontSize,12)}};
}
export async function exportDocument(editor,format){
  const {blocks,defaults}=exportSnapshot(editor);
  const blob=format==='pdf'?await(await import('./pdfExport.js')).pdfBlob(blocks,defaults):await(await import('./wordExport.js')).wordBlob(blocks,defaults);
  const url=URL.createObjectURL(blob),anchor=document.createElement('a');
  anchor.href=url;anchor.download=format==='pdf'?'document.pdf':'document.docx';
  document.body.appendChild(anchor);
  try{anchor.click();}finally{anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
