import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'release');
let html=await fs.readFile(path.join(root,'_site/index.html'),'utf8');
for(const match of Array.from(html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g))){const css=await fs.readFile(path.join(root,'_site',match[1]),'utf8');html=html.replace(match[0],`<style>${css.replace(/<\/style/gi,'<\\/style')}</style>`);}
let scripts='';for(const match of Array.from(html.matchAll(/<script src="([^"]+)" defer><\/script>/g))){const source=await fs.readFile(path.join(root,'_site',match[1]),'utf8');html=html.replace(match[0],'');scripts+=`<script>${source.replace(/<\/script/gi,'<\\/script')}</script>`;}
html=html.replace('</body>',scripts+'</body>');await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'filsdynamic_preview.html'),html);console.log('Created release/filsdynamic_preview.html');
