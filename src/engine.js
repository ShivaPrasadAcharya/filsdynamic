(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.JudgmentEngine=api;})(typeof window==='object'?window:globalThis,function(){
'use strict';
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main', R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const XMLNS='http://www.w3.org/XML/1998/namespace', REL='http://schemas.openxmlformats.org/package/2006/relationships';
const DOCX_MIME='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const defaults={preset:'court',scope:'all',font:'Mangal',fontSize:14,align:'both',bold:'keep',line:1.5,after:6,firstLine:0,headings:true,headingSize:16,pages:true,paper:'A4',left:27,right:20,top:20,bottom:20,numbering:'keep',digits:'ne',start:1,restart:false,strip:false};
const names={court:'अदालत / मुख्य शीर्षक',heading:'खण्ड शीर्षक',metadata:'विवरण / पक्षहरू',body:'मुख्य पाठ',signature:'हस्ताक्षर',keep:'मूलवत् राख्ने'};
const all=(node,tag)=>Array.from(node.getElementsByTagNameNS(W,tag));
const children=node=>Array.from(node.childNodes).filter(n=>n.nodeType===1);
const child=(node,tag)=>children(node).find(n=>n.namespaceURI===W&&n.localName===tag);
const value=(node,tag)=>{const n=child(node,tag);return n?n.getAttributeNS(W,'val'):null;};
const attr=(node,name)=>node.getAttributeNS(W,name);
function xml(text){if(/<!DOCTYPE/i.test(text))throw new Error('DTD भएको XML स्वीकार गर्न सकिएन।');const d=new DOMParser().parseFromString(text,'application/xml');if(d.getElementsByTagName('parsererror').length)throw new Error('फाइलको XML बिग्रिएको छ।');return d;}
const serialize=d=>new XMLSerializer().serializeToString(d);
const el=(doc,tag,attrs={})=>{const e=doc.createElementNS(W,'w:'+tag);for(const[k,v]of Object.entries(attrs))e.setAttributeNS(W,'w:'+k,String(v));return e;};
function set(parent,tag,attrs){let e=child(parent,tag);if(!e){e=el(parent.ownerDocument,tag);parent.appendChild(e);}for(const[k,v]of Object.entries(attrs))e.setAttributeNS(W,'w:'+k,String(v));return e;}
function prop(node,tag){let p=child(node,tag);if(!p){p=el(node.ownerDocument,tag);node.insertBefore(p,node.firstChild);}return p;}
function remove(parent,tag){const e=child(parent,tag);if(e)parent.removeChild(e);}
const P_ORDER='pStyle keepNext keepLines pageBreakBefore framePr widowControl numPr suppressLineNumbers pBdr shd tabs suppressAutoHyphens kinsoku wordWrap overflowPunct topLinePunct autoSpaceDE autoSpaceDN bidi adjustRightInd snapToGrid spacing ind contextualSpacing mirrorIndents suppressOverlap jc textDirection textAlignment textboxTightWrap outlineLvl divId cnfStyle rPr sectPr pPrChange'.split(' ');
const RUN_ORDER='rStyle rFonts b bCs i iCs caps smallCaps strike dstrike outline shadow emboss imprint noProof snapToGrid vanish webHidden color spacing w kern position sz szCs highlight u effect bdr shd fitText vertAlign rtl cs em lang eastAsianLayout specVanish oMath rPrChange'.split(' ');
function sortProps(p,order){const rank=e=>{const i=order.indexOf(e.localName);return i<0?order.length:i;};for(const node of children(p).sort((a,b)=>rank(a)-rank(b)))p.appendChild(node);}
function paragraphText(p){let text='';function walk(node){for(const c of Array.from(node.childNodes)){if(c.nodeType!==1)continue;if(c.namespaceURI===W&&['txbxContent','pPr','rPr','sectPr'].includes(c.localName))continue;if(c.namespaceURI===W&&c.localName==='t')text+=c.textContent;else if(c.namespaceURI===W&&c.localName==='tab')text+='\t';else if(c.namespaceURI===W&&['br','cr'].includes(c.localName))text+='\n';else walk(c);}}walk(p);return text;}
const prefixPattern=/^\s*(?:[०-९0-9]+(?:[.=][०-९0-9]+)+[.।)=]?|[०-९0-9]+[.।)=])[\t \u00a0]+/;
const manualPrefix=text=>(text.match(prefixPattern)||[''])[0];
function classify(text,index,seenSection,inTable){
 if(inTable)return 'keep';const t=text.trim().replace(prefixPattern,'').replace(/[:ः।\-–—]+$/,'').trim();
 if(t.length<110&&/^(?:सङ्क्षिप्त तथ्य|संक्षिप्त तथ्य|तथ्य(?:\s*खण्ड)?|ठहर(?:\s*खण्ड)?|ठहर तथा निर्णय|निर्णय(?:\s*खण्ड)?|तपसि?ल(?:\s*खण्ड)?|फैसला|आदेश|सजाय निर्धारण(?: आदेश)?|कानूनी विश्लेषण|प्रमाणको मूल्याङ्कन)$/.test(t))return 'heading';
 if(index<12&&t.length<100&&/अदालत(?:मा)?$/.test(t))return 'court';
 if(t.length<100&&(/^(?:जिल्ला न्यायाधीश|न्यायाधीश|इति संवत्|इति सम्वत्|फैसला तयार)/.test(t)||/^\[?(?:हस्ताक्षर|नाम)\]?$/.test(t)))return 'signature';
 if(!seenSection&&index<25&&(/^(?:मुद्दा|मुद्दा नं|दर्ता|फैसला मिति|निर्णय नं|वादी|प्रतिवादी|पुनरावेदक|प्रत्यर्थी|श्री|इजलास|माननीय)/.test(t)||t.length<45))return 'metadata';
 return 'body';
}
function ancestors(node,tag){for(let p=node.parentNode;p;p=p.parentNode)if(p.namespaceURI===W&&p.localName===tag)return true;return false;}
function scan(document){const body=all(document,'body')[0];if(!body)throw new Error('Word document body फेला परेन।');let seen=false;return all(body,'p').filter(p=>!ancestors(p,'txbxContent')).map((p,id)=>{const text=paragraphText(p),table=ancestors(p,'tbl'),role=classify(text,id,seen,table);if(role==='heading'&&/तथ्य|ठहर|निर्णय/.test(text))seen=true;const num=child(child(p,'pPr')||p,'numPr');return{id,text,role,table,level:Number(num?value(num,'ilvl')||0:Math.max(0,((manualPrefix(text).trim().match(/^[०-९0-9]+(?:[.=][०-९0-9]+)*/)||[''])[0].split(/[.=]/).filter(Boolean).length)-1)),selected:false,manual:manualPrefix(text),numbered:!!num};});}
async function readDocx(buffer,deps){const zip=await deps.JSZip.loadAsync(buffer);let total=0;for(const entry of Object.values(zip.files)){total+=entry._data?.uncompressedSize||0;if(total>120*1024*1024)throw new Error('यो DOCX धेरै ठूलो छ। सानो भागमा विभाजन गरी प्रयोग गर्नुहोस्।');}const main=zip.file('word/document.xml');if(!main)throw new Error('यो मान्य DOCX फाइल होइन।');const document=xml(await main.async('string'));if(document.documentElement.namespaceURI!==W)throw new Error('यस Word XML ढाँचालाई Standard DOCX मा Save As गरेर पुनः खोल्नुहोस्।');const entries=scan(document);if(entries.length>8000)throw new Error('८००० भन्दा बढी अनुच्छेद भएको फाइललाई भाग लगाएर प्रयोग गर्नुहोस्।');return{zip,document,paragraphs:entries,buffer,warnings:[],kind:'docx'};}
function escapeXML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function newRun(document,data){const r=el(document,'r'),style=data.style||{},rp=el(document,'rPr');
 const font=typeof style.font==='string'?style.font:style.font?.name;
 if(font)rp.appendChild(el(document,'rFonts',{ascii:font,hAnsi:font,eastAsia:font,cs:font}));
 for(const[key,tag]of[['bold','b'],['italic','i'],['strikethrough','strike']])if(style[key])rp.appendChild(el(document,tag));
 if(style.underline)rp.appendChild(el(document,'u',{val:'single'}));if(style.fontSize){rp.appendChild(el(document,'sz',{val:style.fontSize}));rp.appendChild(el(document,'szCs',{val:style.fontSize}));}
 if(style.foreground){const c=style.foreground;if(['red','green','blue'].every(k=>Number.isFinite(c[k])))rp.appendChild(el(document,'color',{val:[c.red,c.green,c.blue].map(v=>Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('')}));}
 if(rp.childNodes.length){sortProps(rp,RUN_ORDER);r.appendChild(rp);}
 const pieces=String(data.value||'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').split(/(\t|\n)/);
 for(const piece of pieces){if(piece==='\t')r.appendChild(el(document,'tab'));else if(piece==='\n')r.appendChild(el(document,'br'));else if(piece){const t=el(document,'t');t.setAttributeNS(XMLNS,'xml:space','preserve');t.textContent=piece;r.appendChild(t);}}
 return r;
}
function plainParagraphs(text){return text.replace(/\r\n?/g,'\n').split('\n').map(value=>({style:{},content:[{value,style:{}}]}));}
async function createDocx(paragraphs,deps,settings={}){
 const zip=new deps.JSZip(),doc=xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W}" xmlns:r="${R}"><w:body/></w:document>`),body=all(doc,'body')[0];
 for(const input of paragraphs){const p=el(doc,'p'),pp=el(doc,'pPr'),style=input.style||{};if(style.align)set(pp,'jc',{val:style.align==='justify'?'both':style.align});if(style.indent||style.firstLineIndent)set(pp,'ind',{left:style.indent||0,firstLine:style.firstLineIndent||0});if(pp.childNodes.length)p.appendChild(pp);for(const run of input.content||[])if(typeof run.value==='string')p.appendChild(newRun(doc,run));body.appendChild(p);}
 const section=el(doc,'sectPr');section.appendChild(el(doc,'pgSz',{w:11906,h:16838}));section.appendChild(el(doc,'pgMar',{top:1134,right:1134,bottom:1134,left:1531,header:708,footer:708,gutter:0}));body.appendChild(section);
 zip.file('[Content_Types].xml',`<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`);
 zip.file('_rels/.rels',`<?xml version="1.0"?><Relationships xmlns="${REL}"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`);
 zip.file('word/_rels/document.xml.rels',`<?xml version="1.0"?><Relationships xmlns="${REL}"><Relationship Id="rIdStyles" Type="${R}/styles" Target="styles.xml"/></Relationships>`);
 zip.file('word/styles.xml',`<?xml version="1.0"?><w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Mangal" w:hAnsi="Mangal" w:cs="Mangal"/><w:sz w:val="28"/><w:szCs w:val="28"/><w:lang w:val="ne-NP" w:bidi="ne-NP"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`);
 zip.file('word/document.xml',serialize(doc));
 for(const[kind,text]of Object.entries(settings)){if(['header','footer'].includes(kind)&&text?.trim()){
  const part=xml(`<w:${kind==='header'?'hdr':'ftr'} xmlns:w="${W}"/>`);for(const para of plainParagraphs(text)){const p=el(part,'p');for(const run of para.content)p.appendChild(newRun(part,run));part.documentElement.appendChild(p);}zip.file(`word/${kind}1.xml`,serialize(part));
  const relation=xml(await zip.file('word/_rels/document.xml.rels').async('string')),id=`rId${kind}`;const e=relation.createElementNS(REL,'Relationship');for(const[k,v]of Object.entries({Id:id,Type:`${R}/${kind}`,Target:`${kind}1.xml`}))e.setAttribute(k,v);relation.documentElement.appendChild(e);zip.file('word/_rels/document.xml.rels',serialize(relation));
  const ref=el(doc,kind+'Reference',{type:'default'});ref.setAttributeNS(R,'r:id',id);section.insertBefore(ref,section.firstChild);
  const types=xml(await zip.file('[Content_Types].xml').async('string')),over=types.createElementNS(types.documentElement.namespaceURI,'Override');over.setAttribute('PartName',`/word/${kind}1.xml`);over.setAttribute('ContentType',`application/vnd.openxmlformats-officedocument.wordprocessingml.${kind}+xml`);types.documentElement.appendChild(over);zip.file('[Content_Types].xml',serialize(types));
 }}
 zip.file('word/document.xml',serialize(doc));return readDocx(await zip.generateAsync({type:'arraybuffer'}),deps);
}
function decode(buffer){const bytes=new Uint8Array(buffer);if(bytes[0]===255&&bytes[1]===254)return new TextDecoder('utf-16le').decode(bytes);if(bytes[0]===254&&bytes[1]===255)return new TextDecoder('utf-16be').decode(bytes);try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new Error('TXT फाइल UTF-8 वा UTF-16 मा सुरक्षित गरी पुनः खोल्नुहोस्।');}}
function cleanRTFUnicode(text){
 let output='',i=0,uc=1;const stack=[];
 while(i<text.length){const c=text[i];if(c==='{'){stack.push(uc);output+=c;i++;continue;}if(c==='}'){uc=stack.pop()??1;output+=c;i++;continue;}if(c!=='\\'){output+=c;i++;continue;}
  const match=text.slice(i).match(/^\\([a-zA-Z]+)(-?\d+)? ?/);if(!match){output+=text.slice(i,i+2);i+=2;continue;}
  const[word,command,number]=match;output+=word;i+=word.length;if(command==='uc'){uc=Math.max(0,Math.min(16,Number(number)||0));continue;}if(command!=='u')continue;
  // The parser emits Unicode; remove its RTF fallback bytes to avoid adding '?' to Nepali words.
  if(!word.endsWith(' '))output+=' ';let skip=uc;
  while(skip>0&&i<text.length){if(/[\r\n]/.test(text[i])){i++;continue;}if(text[i]==='{'||text[i]==='}')break;if(text[i]==='\\'){if(/^\\'[0-9a-fA-F]{2}/.test(text.slice(i))){i+=4;skip--;continue;}if(/^\\[\\{}~_-]/.test(text.slice(i))){i+=2;skip--;continue;}break;}i++;skip--;}
 }return output;
}
function rtfParagraphs(content){const result=[];let loose=[];const spans=items=>items.flatMap(item=>typeof item.value==='string'?[item]:Array.isArray(item.content)?spans(item.content):[]);const flush=()=>{if(loose.length){result.push({style:loose[0].style||{},content:loose});loose=[];}};for(const item of content){if(typeof item.value==='string')loose.push(item);else if(Array.isArray(item.content)){flush();result.push({style:item.style||{},content:spans(item.content)});}}flush();return result;}
async function importFile(file,deps){
 if(file.size>25*1024*1024)throw new Error('अधिकतम फाइल आकार २५ MB हो।');const ext=file.name.split('.').pop().toLowerCase();if(!['docx','doc','rtf','txt'].includes(ext))throw new Error('.docx, .doc, .rtf वा .txt फाइल छान्नुहोस्।');const buffer=await file.arrayBuffer(),bytes=new Uint8Array(buffer);let result;
 if(ext==='docx'||(bytes[0]===80&&bytes[1]===75))result=await readDocx(buffer,deps);
 else if(ext==='txt')result=await createDocx(plainParagraphs(decode(buffer)),deps);
 else if(ext==='rtf'||new TextDecoder().decode(bytes.slice(0,10)).startsWith('{\\rtf')){
  const rtfText=cleanRTFUnicode(new TextDecoder('windows-1252').decode(bytes));const parsed=await deps.parseRTF(rtfText);result=await createDocx(rtfParagraphs(parsed.content),deps);result.warnings.push('RTF को समर्थित bold, italic, underline र alignment आयात गरियो। जटिल table, list, चित्र तथा page layout जस्ताको तस्तै नरहन सक्छ।');
 }else if(bytes[0]===0xd0&&bytes[1]===0xcf){
  const extracted=await deps.extractDoc(buffer);let paragraphs=plainParagraphs(extracted.getBody({filterUnicode:false}));
  const notes=[['मूल फाइलका पादटिप्पणी',extracted.getFootnotes({filterUnicode:false})],['मूल फाइलका अन्तटिप्पणी',extracted.getEndnotes({filterUnicode:false})],['मूल फाइलका टिप्पणी',extracted.getAnnotations({filterUnicode:false})],['मूल फाइलका text box पाठ',extracted.getTextboxes({filterUnicode:false})]].filter(([,text])=>text?.trim());
  for(const[label,text]of notes)paragraphs.push(...plainParagraphs('\n'+label+'\n'+text));
  result=await createDocx(paragraphs,deps,{header:extracted.getHeaders({includeFooters:false,filterUnicode:false}),footer:extracted.getFooters({filterUnicode:false})});
  result.warnings.push('पुरानो .doc बाट पाठ आयात गरिएको छ। मूल font, table, चित्र र जटिल layout सुरक्षित हुँदैनन्। राम्रो संरक्षणका लागि Word मा .docx बनाएर आयात गर्नुहोस्।');if(notes.length)result.warnings.push('पादटिप्पणी, अन्तटिप्पणी, टिप्पणी वा text box को उपलब्ध पाठ दस्तावेजको अन्त्यमा छुट्टै खण्डमा राखिएको छ।');
 }else{
  const text=decode(buffer);if(!/<(?:html|body|p|div|table)[\s>]/i.test(text))throw new Error('यो .doc ढाँचा पढ्न सकिएन। Word मा .docx बनाएर पुनः खोल्नुहोस्।');
  const html=new DOMParser().parseFromString(text,'text/html');const blocks=Array.from(html.body.querySelectorAll('p,h1,h2,h3,li,tr'));const paragraphs=(blocks.length?blocks:[html.body]).map(p=>({style:{align:p.style.textAlign||'left'},content:[{value:p.textContent,style:{bold:p.matches('h1,h2,h3')||p.style.fontWeight==='bold'}}]}));result=await createDocx(paragraphs,deps);result.warnings.push('HTML आधारित .doc बाट पाठ तथा सामान्य formatting आयात गरियो। जटिल layout समीक्षा गर्नुहोस्।');
 }
 result.kind=ext;result.name=file.name;result.size=file.size;
 if(!result.paragraphs.some(p=>p.text.trim()))throw new Error('पढ्न मिल्ने पाठ फेला परेन। स्क्यान वा password-protected फाइललाई सम्पादनयोग्य DOCX मा बदल्नुहोस्।');
 const fonts=all(result.document,'rFonts').flatMap(e=>[attr(e,'ascii'),attr(e,'hAnsi'),attr(e,'cs')]).filter(Boolean);if(fonts.some(f=>/preeti|kantipur|sagarmatha|himalb/i.test(f)))result.warnings.push('पुरानो नेपाली font भेटियो। अक्षरको अर्थ नबिग्रियोस् भनेर Font मा “मूलवत्” राख्नुहोस्। यस app ले Preeti बाट Unicode मा रूपान्तरण गर्दैन।');
 return result;
}
function stripPrefix(p,prefix){let remaining=prefix.length;for(const t of all(p,'t')){if(!remaining)break;const remove=Math.min(remaining,t.textContent.length);t.textContent=t.textContent.slice(remove);remaining-=remove;}}
async function addNumbering(zip,options){
 let d=zip.file('word/numbering.xml')?xml(await zip.file('word/numbering.xml').async('string')):xml(`<w:numbering xmlns:w="${W}"/>`);
 const ids=[...all(d,'abstractNum').map(e=>Number(attr(e,'abstractNumId'))),...all(d,'num').map(e=>Number(attr(e,'numId')))];const base=Math.max(0,...ids)+1;
 const abstract=el(d,'abstractNum',{abstractNumId:base});abstract.appendChild(el(d,'multiLevelType',{val:'multilevel'}));
 for(let i=0;i<9;i++){const lvl=el(d,'lvl',{ilvl:i});lvl.appendChild(el(d,'start',{val:i===0?options.start:1}));lvl.appendChild(el(d,'numFmt',{val:options.digits==='ne'?'hindiNumbers':'decimal'}));lvl.appendChild(el(d,'lvlText',{val:Array.from({length:i+1},(_,j)=>'%'+(j+1)).join('.')+'.'}));lvl.appendChild(el(d,'suff',{val:'space'}));lvl.appendChild(el(d,'lvlJc',{val:'left'}));const pp=el(d,'pPr');pp.appendChild(el(d,'ind',{left:600+i*600,hanging:600}));lvl.appendChild(pp);const rp=el(d,'rPr');if(options.font)rp.appendChild(el(d,'rFonts',{ascii:options.font,hAnsi:options.font,cs:options.font}));if(options.fontSize){rp.appendChild(el(d,'sz',{val:options.fontSize*2}));rp.appendChild(el(d,'szCs',{val:options.fontSize*2}));}rp.appendChild(el(d,'lang',{val:options.digits==='ne'?'ne-NP':'en-US'}));lvl.appendChild(rp);abstract.appendChild(lvl);}
 d.documentElement.appendChild(abstract);let next=base;
 function instance(){const id=next++,num=el(d,'num',{numId:id});num.appendChild(el(d,'abstractNumId',{val:base}));d.documentElement.appendChild(num);return id;}
 const relationships=zip.file('word/_rels/document.xml.rels')?xml(await zip.file('word/_rels/document.xml.rels').async('string')):xml(`<Relationships xmlns="${REL}"/>`);
 if(!Array.from(relationships.documentElement.childNodes).some(e=>e.nodeType===1&&e.getAttribute('Type')===`${R}/numbering`)){const e=relationships.createElementNS(REL,'Relationship');let id='rIdFDNumbering';const used=new Set(Array.from(relationships.documentElement.childNodes).filter(n=>n.nodeType===1).map(n=>n.getAttribute('Id')));while(used.has(id))id+='X';for(const[k,v]of Object.entries({Id:id,Type:`${R}/numbering`,Target:'numbering.xml'}))e.setAttribute(k,v);relationships.documentElement.appendChild(e);zip.file('word/_rels/document.xml.rels',serialize(relationships));}
 const types=xml(await zip.file('[Content_Types].xml').async('string'));if(!Array.from(types.documentElement.childNodes).some(e=>e.nodeType===1&&e.getAttribute('PartName')==='/word/numbering.xml')){const e=types.createElementNS(types.documentElement.namespaceURI,'Override');e.setAttribute('PartName','/word/numbering.xml');e.setAttribute('ContentType','application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml');types.documentElement.appendChild(e);zip.file('[Content_Types].xml',serialize(types));}
 return{instance,save:()=>zip.file('word/numbering.xml',serialize(d))};
}
function runFormatting(p,options,role){
 const heading=options.headings&&['court','heading'].includes(role);
 for(const r of all(p,'r')){const rp=prop(r,'rPr');if(options.font)set(rp,'rFonts',{ascii:options.font,hAnsi:options.font,eastAsia:options.font,cs:options.font});const size=heading?options.headingSize:options.fontSize;if(size){set(rp,'sz',{val:Math.round(size*2)});set(rp,'szCs',{val:Math.round(size*2)});}if(heading||options.bold!=='keep'){const bold=heading||options.bold==='on';set(rp,'b',{val:bold?1:0});set(rp,'bCs',{val:bold?1:0});}sortProps(rp,RUN_ORDER);}
}
function validateOptions(o){for(const[k,min,max]of[['fontSize',6,72],['headingSize',6,72],['line',.8,3],['after',0,50],['firstLine',0,30],['left',5,70],['right',5,70],['top',5,70],['bottom',5,70],['start',1,9999]]){if(o[k]!==''&&(!Number.isFinite(Number(o[k]))||Number(o[k])<min||Number(o[k])>max))throw new Error(`अमान्य setting: ${k}`);}if(o.pages&&Number(o.left)+Number(o.right)>150)throw new Error('बायाँ र दायाँ margin धेरै ठूलो भयो।');}
async function format(input,rawOptions,deps){
 const o={...defaults,...rawOptions};if(o.preset==='original')return{buffer:input.buffer,changed:0,numbered:0,unchanged:true};validateOptions(o);
 const zip=await deps.JSZip.loadAsync(input.buffer),document=xml(await zip.file('word/document.xml').async('string')),body=all(document,'body')[0],paragraphs=all(body,'p').filter(p=>!ancestors(p,'txbxContent'));
 const numbering=['replace','missing'].includes(o.numbering)?await addNumbering(zip,o):null;let numId=numbering?numbering.instance():0,changed=0,numbered=0,lastLevel=-1;
 for(const record of input.paragraphs){const p=paragraphs[record.id];if(!p||!record.text.trim()||record.role==='keep')continue;if(o.scope==='selected'&&!record.selected)continue;const pp=prop(p,'pPr'),isHeading=['court','heading'].includes(record.role);changed++;
  if(o.headings&&isHeading){set(pp,'jc',{val:'center'});set(pp,'keepNext',{val:1});set(pp,'keepLines',{val:1});}
  else if(o.headings&&record.role==='signature')set(pp,'jc',{val:'right'});
  else if(o.align!=='keep')set(pp,'jc',{val:o.align});
  if(o.line!==''||o.after!==''){const attrs={};if(o.line!==''){attrs.line=Math.round(o.line*240);attrs.lineRule='auto';}if(o.after!=='')attrs.after=Math.round(o.after*20);set(pp,'spacing',attrs);}
  if(o.firstLine!==''&&record.role==='body'){const ind=set(pp,'ind',{firstLine:Math.round(o.firstLine*56.6929)});ind.removeAttributeNS(W,'hanging');}
  set(pp,'widowControl',{val:1});runFormatting(p,o,record.role);
  if(record.role==='heading'&&o.restart&&numbering){numId=numbering.instance();lastLevel=-1;}
  if(record.role==='body'&&!record.table){
   if(o.numbering==='none'){const np=set(pp,'numPr',{});set(np,'numId',{val:0});}
   else if(numbering&&!(o.numbering==='missing'&&(record.manual||record.numbered))){
    if(record.manual&&!o.strip){sortProps(pp,P_ORDER);continue;}const level=Math.max(0,Math.min(8,Number(record.level)||0));if(level>lastLevel+1)throw new Error(`अनुच्छेद ${record.id+1}: उपप्रकरणभन्दा पहिले अघिल्लो तहको मुख्य प्रकरण राख्नुहोस्।`);lastLevel=level;if(record.manual&&o.strip)stripPrefix(p,record.manual);
    const np=set(pp,'numPr',{});set(np,'ilvl',{val:Math.max(0,Math.min(8,Number(record.level)||0))});set(np,'numId',{val:numId});remove(pp,'ind');numbered++;
   }
  }sortProps(pp,P_ORDER);
 }
 if(o.headings){for(let i=0;i<input.paragraphs.length;i++){const record=input.paragraphs[i];if(record.role!=='signature'||(o.scope==='selected'&&!record.selected))continue;let j=i-1;while(j>=0&&!input.paragraphs[j].text.trim())j--;if(j>=0&&input.paragraphs[j].role!=='keep'&&(o.scope!=='selected'||input.paragraphs[j].selected)){const pp=prop(paragraphs[input.paragraphs[j].id],'pPr');set(pp,'keepNext',{val:1});sortProps(pp,P_ORDER);}}}
 if(o.pages){const dimensions={A4:[11906,16838],Letter:[12240,15840],Legal:[12240,20160]}[o.paper];if(!dimensions)throw new Error('अमान्य paper size');let sections=all(document,'sectPr');if(!sections.length){body.appendChild(el(document,'sectPr'));sections=all(document,'sectPr');}for(const sect of sections){set(sect,'pgSz',{w:dimensions[0],h:dimensions[1]});const mar=set(sect,'pgMar',Object.fromEntries(['left','right','top','bottom'].map(k=>[k,Math.round(o[k]*56.6929)])));if(!attr(mar,'header'))mar.setAttributeNS(W,'w:header','708');if(!attr(mar,'footer'))mar.setAttributeNS(W,'w:footer','708');}}
 if(numbering)numbering.save();zip.file('word/document.xml',serialize(document));return{buffer:await zip.generateAsync({type:'arraybuffer',compression:'DEFLATE'}),changed,numbered};
}
async function previewSafe(buffer,deps){const zip=await deps.JSZip.loadAsync(buffer);for(const[path,file]of Object.entries(zip.files)){if(!path.endsWith('.rels'))continue;const doc=xml(await file.async('string'));let changed=false;for(const e of Array.from(doc.documentElement.childNodes)){if(e.nodeType===1&&e.getAttribute('TargetMode')==='External'){e.parentNode.removeChild(e);changed=true;}}if(changed)zip.file(path,serialize(doc));}return zip.generateAsync({type:'arraybuffer'});}
return{W,R,DOCX_MIME,defaults,names,xml,serialize,paragraphText,plainParagraphs,createDocx,importFile,readDocx,format,previewSafe,manualPrefix,cleanRTFUnicode,rtfParagraphs};
});
