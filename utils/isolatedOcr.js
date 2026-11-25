import {fork} from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {limits,resourceError,setting} from './resourceProtection.js';

// File IPC avoids base64/Buffer copies of large PDFs in the web process.
export async function isolatedOcr(input,{image=false,textOnly=false,signal}={},consume) {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'talkntype-ocr-'));
  await fs.chmod(dir,0o700);
  const output=path.join(dir,'result');
  let child,timer,monitor,peak=0;
  try {
    const result=await new Promise((resolve,reject)=>{
      child=fork(fileURLToPath(new URL('./ocrChild.js',import.meta.url)),[input,output,JSON.stringify({image,textOnly})],{execArgv:['--max-old-space-size=192'],stdio:['ignore','ignore','ignore','ipc']});
      let failure;
      const stop=error=>{failure ||= error;child.kill('SIGKILL');};
      const abort=()=>stop(resourceError(504,'OCR cancelled or timed out. Try fewer pages.'));
      signal?.addEventListener('abort',abort,{once:true});
      if(signal?.aborted)abort();
      timer=setTimeout(abort,limits.timeout);
      // Linux /proc RSS includes native canvases, WASM and Tesseract threads.
      // A sampled guard is headroom protection, not a hard OS memory guarantee.
      if(process.platform==='linux')monitor=setInterval(async()=>{
        try {
          const status=await fs.readFile(`/proc/${child.pid}/status`,'utf8');
          const rss=Number(status.match(/^VmRSS:\s+(\d+)/m)?.[1]||0)*1024+process.memoryUsage().rss;
          peak=Math.max(peak,rss);
          if(rss>setting('OCR_PROCESS_BUDGET_MB',420)*1024*1024)stop(resourceError(413,'PDF exceeds the OCR memory budget. Split it into smaller PDFs.'));
        } catch {}
      },50);
      let metadata;
      child.on('message',message=>{if(message.rss){peak=Math.max(peak,message.rss+process.memoryUsage().rss);if(peak>setting('OCR_PROCESS_BUDGET_MB',420)*1024*1024)stop(resourceError(413,'PDF exceeds the OCR memory budget. Split it into smaller PDFs.'));return;}if(message.error)failure=resourceError(message.status||500,message.error);else metadata=message;});
      child.once('error',reject);
      child.once('exit',code=>{
        clearTimeout(timer);clearInterval(monitor);
        signal?.removeEventListener('abort',abort);
        if(failure)reject(Object.assign(failure,{peakRssBytes:peak}));
        else if(code!==0||!metadata)reject(resourceError(413,'OCR worker exceeded its resources or failed. Try a smaller PDF.'));
        else resolve({...metadata,peakRssBytes:peak});
      });
    });
    return await consume(output,result);
  }finally{clearTimeout(timer);clearInterval(monitor);if(child?.exitCode===null)child.kill('SIGKILL');await fs.rm(dir,{recursive:true,force:true});}
}
