import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
export const models={
  eng:'7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2',
  hin:'4c73ffc59d497c186b19d1e90f5d721d678ea6b2e277b719bee4e2af12271825',
  mar:'0ba3f2d116972e72fe9e176bc84c38e81dfb6670f4ed1f7f6c8e16a27da7cb61',
};
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function provision(){
  const destination=path.resolve('ocr-data');await fs.mkdir(destination,{recursive:true});
  for(const [lang,hash] of Object.entries(models)){
    const target=path.join(destination,lang+'.traineddata');
    if(await fs.readFile(target).then(bytes=>digest(bytes)===hash,()=>false)){console.log(lang+': verified');continue;}
    const response=await fetch(`https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/4.1.0/${lang}.traineddata`,{signal:AbortSignal.timeout(120000)});
    if(!response.ok)throw Error(`Cannot provision ${lang}: HTTP ${response.status}`);
    const bytes=Buffer.from(await response.arrayBuffer());
    if(digest(bytes)!==hash)throw Error(`Invalid checksum for ${lang}`);
    await fs.writeFile(target,bytes,{mode:0o600});console.log(lang+': provisioned and verified');
  }
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await provision();
