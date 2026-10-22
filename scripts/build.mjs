import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {Transform,PassThrough} from 'node:stream';
const require=createRequire(import.meta.url),browserify=require('browserify');
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'_site');
await fs.mkdir(out,{recursive:true});
for(const name of ['index.html','styles.css','app.js'])await fs.copyFile(path.join(root,'public',name),path.join(out,name));
await fs.copyFile(path.join(root,'src/engine.js'),path.join(out,'engine.js'));
// word-extractor 1.0.4 includes one byte of the UTF-16 directory-name terminator.
// Node drops that odd byte; browser Buffer decodes it as NUL. Exclude both bytes.
const bundler=browserify(path.join(root,'src/vendor.cjs')).transform(file=>{
 if(!file.endsWith('/word-extractor/lib/ole-directory-tree.js'))return new PassThrough();
 let text='';return new Transform({transform(chunk,encoding,next){text+=chunk;next();},flush(next){const before='buffer.readInt16LE(64 + offset) - 1';if(!text.includes(before))return next(new Error('Legacy DOC compatibility patch no longer matches the pinned dependency'));this.push(text.replace(before,'buffer.readInt16LE(64 + offset) - 2'));next();}});
},{global:true});
const bundle=await new Promise((resolve,reject)=>bundler.bundle((error,buffer)=>error?reject(error):resolve(buffer)));
await fs.writeFile(path.join(out,'vendor.js'),bundle);await fs.writeFile(path.join(out,'.nojekyll'),'');
const licenses=[];for(const name of ['jszip','docx-preview','word-extractor','rtf-parser']){const folder=path.join(root,'node_modules',name);for(const candidate of ['LICENSE','LICENSE.md','LICENSE.txt','license']){try{licenses.push(`${name}\n${await fs.readFile(path.join(folder,candidate),'utf8')}\n`);break;}catch{}}}
await fs.writeFile(path.join(out,'THIRD_PARTY_LICENSES.txt'),licenses.join('\n--------------------\n'));
console.log('Built browser-local judgment formatter in _site/');
