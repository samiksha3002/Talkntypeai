import fs from 'node:fs/promises';
import {searchablePdf} from './searchablePdf.js';
const [input,output,options]=process.argv.slice(2);
const sample=()=>process.send?.({rss:process.memoryUsage().rss});
const monitor=setInterval(sample,50);sample();
try {
  const result=await searchablePdf(await fs.readFile(input),JSON.parse(options));
  await fs.writeFile(output,result.buffer||result.text,{mode:0o600});
  sample();process.send({words:result.words});
} catch(error) {
  process.send({status:error.resourceProtection?error.status:500,error:error.resourceProtection?error.message:'Local OCR failed. Check provisioned language resources and retry.'});
  process.exitCode=1;
}finally{clearInterval(monitor);process.disconnect();}
