import {isolatedOcr} from '../utils/isolatedOcr.js';
import fs from 'node:fs/promises';
import path from 'node:path';
const input=process.argv[2],textOnly=process.argv.includes('--text');
const started=Date.now();
try {
 const result=await isolatedOcr(input,{textOnly},async(output,meta)=>({bytes:(await fs.stat(output)).size,...meta}));
 console.log(JSON.stringify({fixture:path.basename(input),textOnly,status:'completed',...result,elapsedMs:Date.now()-started,platform:process.platform}));
} catch(error) {
 console.log(JSON.stringify({fixture:path.basename(input),textOnly,status:'rejected',code:error.status,error:error.message,peakRssBytes:error.peakRssBytes,elapsedMs:Date.now()-started,platform:process.platform}));
 process.exitCode=error.status===413?0:1;
}
