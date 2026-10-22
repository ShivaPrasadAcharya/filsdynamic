import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'release');
let html=await fs.readFile(path.join(root,'_site/index.html'),'utf8');
const css=await fs.readFile(path.join(root,'_site/styles.css'),'utf8');
html=html.replace('<link rel="stylesheet" href="styles.css">',`<style>${css.replace(/<\/style/gi,'<\\/style')}</style>`);
let scripts='';for(const name of ['vendor.js','engine.js','app.js']){const source=await fs.readFile(path.join(root,'_site',name),'utf8');html=html.replace(`<script src="${name}" defer></script>`,'');scripts+=`<script>${source.replace(/<\/script/gi,'<\\/script')}</script>`;}
html=html.replace('</body>',scripts+'</body>');await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'filsdynamic_preview.html'),html);console.log('Created release/filsdynamic_preview.html');
