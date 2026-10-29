// Zero-runtime-dependency build. Only dist/ is deployed.
import { readFileSync, mkdirSync, writeFileSync, cpSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import { buildPages, resourcePaths } from "../web/engine.mjs";
import { markdownToHtml } from "../web/markdown.mjs";
import { generateStaticEdition } from "./static-edition.mjs";
import { generateBehrensEdition } from "./behrens-edition.mjs";
import { ERROR_CODES } from "../functions/api/v1/reviews.js";
const root=resolve(import.meta.dirname,".."), out=resolve(root,"dist");
const read=p=>readFileSync(resolve(root,p),"utf8");
const write=(p,s)=>{const file=resolve(out,p);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,s)};
rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
for(const d of ["web","manuskript"]) cpSync(resolve(root,d),resolve(out,d),{recursive:true,filter:src=>!/(^|[\\/])tests\.mjs$/.test(src)});
write("interaktiv/entscheidungen.json",read("interaktiv/entscheidungen.json"));
const manifest=JSON.parse(read("interaktiv/entscheidungen.json"));
for(const p of resourcePaths(manifest).filter(p=>p.startsWith("../interaktiv/"))){
 const clean=p.slice(3);
 write(clean,read(clean));
}
const resources=Object.fromEntries(resourcePaths(manifest).map(p=>[p,read("web/"+p)]));
// A manuscript timestamp is a stable reading unit; internal *** separators
// are presentation detail and may differ between written alternatives.
function normalize(pages){
 const result=[];
 for(const p of pages){
  const previous=result.at(-1);
  if(p.type==="scene"&&previous?.type==="scene"&&p.source===previous.source&&p.heading===previous.heading){
   previous.markdown+="\n\n***\n\n"+p.markdown;
  }else result.push({...p});
 }
 return result;
}
const base=normalize(buildPages(manifest,resources,{}));
const versions={};
for(const node of manifest.nodes) for(const option of node.options.slice(1)){
 const pages=normalize(buildPages(manifest,resources,{[node.id]:option.id}));
 if(pages.length!==base.length)throw Error("Scene count changed: "+node.id+"/"+option.id);
 versions[node.id+":"+option.id]=pages;
}
const editionHash=createHash("sha256").update("reading-layout-v2\n").update(JSON.stringify(manifest)).update(resourcePaths(manifest).map(p=>resources[p].replace(/\r\n/g,"\n")).join("")).digest("hex").slice(0,16);
const releaseId=createHash("sha256").update(editionHash).update([
  "scripts/build.mjs","scripts/static-edition.mjs","scripts/behrens-edition.mjs",
  "web/spinoff-branch.mjs",
  ...["01-ein-morgen.md","02-die-erste-tasse.md","03-das-kind-auf-der-strasse.md","04-die-schublade.md","05-die-fernbedienung.md","06-nichts-weiter.md","07-der-schaum.md","08-die-brotdose.md","09-was-tun.md","10-lost-in-translation.md"].map(name=>"spin-offs/herr-behrens/"+name),
  "web/index.html","web/app.js","web/updates.mjs","web/reading-mode.mjs",
  "web/speech.mjs","web/sw.js","web/style.css","web/static-reader.css",
  "site/herr-behrens/index.html","site/herr-behrens/style.css",
  "site/_headers","site/llms.txt","site/.well-known/ai-catalog.json","site/.well-known/ard.json"
].map(read).join("\n")).update(readFileSync(resolve(root,"site/herr-behrens/preview.jpg"))).digest("hex").slice(0,16);
// Independent landing page, with a share-preview JPEG committed as a binary asset.
write("herr-behrens/index.html",read("site/herr-behrens/index.html"));
write("herr-behrens.css",read("site/herr-behrens/style.css"));
cpSync(resolve(root,"site/herr-behrens/preview.jpg"),resolve(out,"herr-behrens-preview.jpg"));
write("version.json",JSON.stringify({version:releaseId}));
const staticChapters=generateStaticEdition({manifest,pages:base,write,markdownToHtml});
const behrensChapters=generateBehrensEdition({read,write,markdownToHtml});
const catalog=[];
const chapterMap=Object.fromEntries(manifest.manuskript.map((m,i)=>[m.path,{id:"ch"+String(i+1).padStart(2,"0"),label:m.label,url:"/agent/v1/chapters/ch"+String(i+1).padStart(2,"0")+".json",source:m.path}]));
const chapterContents=new Map(Object.values(chapterMap).map(c=>[c.id,[]]));
for(let i=0;i<base.length;i++){
 const original=base[i],id="p"+String(i+1).padStart(4,"0");
 const item={id,type:original.type,source:original.source,heading:original.heading||null,next:i+1<base.length?"p"+String(i+2).padStart(4,"0"):null};
 if(original.type==="choice"){
   const node=manifest.nodes.find(n=>n.id===original.nodeId);
   Object.assign(item,{node_id:node.id,question:node.question,options:node.options.map(o=>({id:o.id,label:o.label,description:o.description}))});
 }else{
   item.text=original.markdown;item.variants={};
   for(const node of manifest.nodes)for(const option of node.options.slice(1)){
     const other=versions[node.id+":"+option.id][i];
     if(other.type!==original.type||other.source!==original.source)throw Error("Scene alignment failed "+id);
     if(other.markdown!==original.markdown){
       if(!item.variants[node.id])item.variants[node.id]={};
       item.variants[node.id][option.id]=other.markdown;
     }
   }
   if(!Object.keys(item.variants).length)delete item.variants;
 }
 write("agent/v1/scenes/"+id+".json",JSON.stringify(item));
 const chapter=chapterMap[original.source];
 if(!chapter)throw Error("Unknown scene source "+original.source);
 chapterContents.get(chapter.id).push(item);
 catalog.push({id:item.id,type:item.type,node_id:item.node_id||null,heading:item.heading,chapter:chapter.id,chars:item.text?.length||0,url:"/agent/v1/scenes/"+id+".json"});
}
const chapterCatalog=Object.values(chapterMap).map(c=>({...c,events:chapterContents.get(c.id).length,chars:chapterContents.get(c.id).reduce((n,s)=>n+(s.text?.length||0),0)}));
for(const chapter of chapterCatalog)write("agent/v1/chapters/"+chapter.id+".json",JSON.stringify({schema_version:1,edition:editionHash,chapter,scenes:chapterContents.get(chapter.id)}));
const totals={events:catalog.length,chapters:chapterCatalog.length,characters_base:chapterCatalog.reduce((n,c)=>n+c.chars,0),choices:manifest.nodes.length};
const agentManifest={schema_version:1,contract_version:1,edition:editionHash,chapters:chapterCatalog,totals,example_review:"/agent/v1/example-review.json",title:"Zuletzt online",language:"de",author:"Benjamin Lam",start:catalog[0].id,scenes:catalog,decision_nodes:manifest.nodes.map(n=>({id:n.id,options:n.options.map(o=>o.id)})),review_schema:"/agent/v1/review.schema.json",review_endpoint:"/api/v1/reviews",guide:"/agent/v1/guide.json",note:"Read every scene in order. Choices select one variant; do not read unchosen variants."};
write("agent/v1/manifest.json",JSON.stringify(agentManifest));

write("agent/v1/guide.json",JSON.stringify({protocol:"zuletzt-online-reader-v1",steps:["Fetch manifest","Fetch chapter bundles from manifest.chapters (15 requests) or each scene individually (220 requests), in order","When type=choice choose exactly one option and record node_id => option id","For a scene with variants, use chosen variant if present; otherwise use text","Continue until next=null","Review only the path actually read; cite scene IDs. Do not claim independent reading if abridged."],completion:"Completed only if every scene of the selected route was actually read; otherwise status abandoned with stopped_at.",variant_rule:{default:"Option a uses the field text",selected:"If variants[node_id][selected_option] exists for a previously encountered choice, that string fully replaces text. Never concatenate default and variant.",example:{choice:{node_id:"kiosk",option:"b"},scene:"If variants.kiosk.b exists, read it instead of text."}},example_review:"/agent/v1/example-review.json",reviews:{method:"POST",url:"/api/v1/reviews",format:"application/json",auth:"Authorization: Bearer <invitation token>",schema:"/agent/v1/review.schema.json",readme:"/agent/v1/service.json"},disclosure:"Model identity, path and observations are self-reported, not cryptographic proof."}));
write("agent/v1/service.json",JSON.stringify({status:"invitation_only",error_codes:ERROR_CODES,retryable_codes:Object.keys(ERROR_CODES).filter(code=>ERROR_CODES[code].retryable),no_retry_codes:Object.keys(ERROR_CODES).filter(code=>!ERROR_CODES[code].retryable),http_quota_behavior:"Cloudflare may return HTML code 1027 (daily free requests) or 1102 (CPU limit) before this API handler runs. Treat as unavailable; no automatic aggressive retries.",backoff:"Honor Retry-After. If service disabled, do not retry until operator confirms it is enabled. No automated retry loops.",cors:"API deliberately does not enable cross-origin browser submissions; server-to-server POST with invitation required."}));
write("agent/v1/example-review.json",JSON.stringify({schema_version:1,edition:editionHash,agent:{provider:"example-provider",model:"example-model"},reading:{status:"completed",choices:{kiosk:"a",strassenbahn:"b",tina:"c",stadt:"a",nordsee:"b"}},review:{stars:3,text:"Dies ist eine ausschließlich illustrative Musterrezension zur Erklärung des Einreichungsformats. Sie ist keine echte literarische Bewertung und wurde keinem KI-Modell zugeordnet.",strengths:["Beispiel für eine konkrete Stärke mit Szenenbezug"],weaknesses:["Beispiel für eine konkrete Schwäche mit Szenenbezug"],interactivity:"Hier gehört eine differenzierte Einschätzung zur erzählerischen Wirkung der Auswahl hin.",observations:[{scene_id:"p0001",finding:"Hier steht die Beobachtung zum ersten tatsächlich gelesenen Abschnitt."},{scene_id:"p0002",finding:"Hier steht die zweite konkrete, überprüfbare Textbeobachtung."}]}}));
write("agent/v1/review.schema.json",read("api/review.schema.json"));
for(const f of ["_headers","_routes.json","robots.txt","llms.txt",".well-known/ai-catalog.json",".well-known/ard.json","impressum/index.html","datenschutz/index.html","about/index.html","site.webmanifest"])write(f,read("site/"+f));
// The public root IS the reader: no prelude, no standalone title page.
// The initial DOM must match the first page rendered by app.js exactly.
// Agent/static bundles normalize *** separators, while the interactive reader does not.
const first=buildPages(manifest,resources,{})[0];
if(first?.type!=="scene"||!first.markdown.includes("Thomas hatte seit drei Tagen nicht geduscht."))throw Error("The first human page must begin with the novel.");
const prerender='<article class="prose">'+markdownToHtml(first.markdown)+'</article>';
const sourceTemplate=read("web/index.html").replace("</head>",'<meta name="reader-version" content="'+releaseId+'"></head>');
const template=sourceTemplate.replace('<main id="reader" tabindex="-1"></main>','<main id="reader" tabindex="-1">'+prerender+'</main>');
if(template===sourceTemplate)throw Error("Pre-render anchor not found");
write("web/index.html",template);
// Social preview cover is generated into the public output, without changing reader assets.
write("og-cover.jpg",Buffer.from(read("site/og-cover.jpg.base64").trim(),"base64"));
const rootReader=template.replaceAll('href="./icon.svg"','href="/web/icon.svg"').replaceAll('href="./icon-192.png"','href="/web/icon-192.png"').replaceAll('href="./style.css"','href="/web/style.css"').replaceAll('src="./app.js"','src="/web/app.js"');
write("index.html",rootReader.replace("</head>",'<meta property="og:type" content="book"><meta property="og:url" content="https://zuletzt-online-243.pages.dev/"><meta property="og:title" content="Zuletzt online – 243"><meta property="og:description" content="Ein interaktiver Kurzroman. Fünf Entscheidungen, 243 mögliche Wege und eine Geschichte."><meta property="og:image" content="https://zuletzt-online-243.pages.dev/og-cover.jpg"><meta property="og:image:secure_url" content="https://zuletzt-online-243.pages.dev/og-cover.jpg"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Buchcover Zuletzt online – 02:43h: eine Heuschrecke vor hellem Hintergrund"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://zuletzt-online-243.pages.dev/og-cover.jpg"><script type="application/ld+json">'+JSON.stringify({"@context":"https://schema.org","@type":"Book",name:"Zuletzt online",author:{"@type":"Person",name:"Benjamin Lam"},inLanguage:"de",description:"Ein Roman von Benjamin Lam.",isAccessibleForFree:true})+'</script></head>'));

// Generate real 192/512px PNG icons without a graphics package or a font dependency.
function crc32(buf){let c=0xffffffff;for(const b of buf){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
function chunk(name,data){const type=Buffer.from(name),n=Buffer.alloc(4),crc=Buffer.alloc(4);n.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([type,data])));return Buffer.concat([n,type,data,crc])}
function makeIcon(size){
 const raw=Buffer.alloc(size*(size*4+1));
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const zTop=y>=size*.32&&y<size*.40&&x>=size*.30&&x<size*.70;
  const zBottom=y>=size*.60&&y<size*.68&&x>=size*.30&&x<size*.70;
  const diagonal=y>=size*.39&&y<size*.61&&Math.abs(x-(size*.70-(y-size*.39)*1.78))<size*.048;
  const bright=zTop||zBottom||diagonal;
  const offset=y*(size*4+1)+1+x*4;
  raw[offset]=bright?248:49;raw[offset+1]=bright?246:86;raw[offset+2]=bright?240:77;raw[offset+3]=255;
 }
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ihdr),chunk("IDAT",deflateSync(raw,{level:9})),chunk("IEND",Buffer.alloc(0))]);
}
for(const size of [192,512])writeFileSync(resolve(out,"web/icon-"+size+".png"),makeIcon(size));
const webManifest=JSON.parse(read("web/manifest.webmanifest"));
webManifest.id="/";
webManifest.start_url="/";
webManifest.scope="/";
webManifest.icons=[{src:"./icon-192.png",sizes:"192x192",type:"image/png",purpose:"any"},{src:"./icon-512.png",sizes:"512x512",type:"image/png",purpose:"any maskable"}];
write("web/manifest.webmanifest",JSON.stringify(webManifest));
const mainManifest=JSON.parse(read("site/site.webmanifest"));
mainManifest.id="/";mainManifest.start_url="/";mainManifest.scope="/";
mainManifest.icons=[{src:"/web/icon-192.png",sizes:"192x192",type:"image/png"},{src:"/web/icon-512.png",sizes:"512x512",type:"image/png"}];
write("site.webmanifest",JSON.stringify(mainManifest));
const cacheShell=["index.html","app.js","updates.mjs","reading-mode.mjs","engine.mjs","speech.mjs","markdown.mjs","spinoff-branch.mjs","style.css","static-reader.css","manifest.webmanifest","icon.svg","icon-192.png","icon-512.png"];
const cacheId=createHash("sha256").update(editionHash).update(Buffer.concat(cacheShell.map(f=>readFileSync(resolve(out,"web",f))))).update(readFileSync(resolve(out,"index.html"))).update(readFileSync(resolve(out,"herr-behrens-preview.jpg"))).digest("hex").slice(0,16);
const worker=read("web/sw.js").replace("__CACHE_ID__",cacheId);
write("web/sw.js",worker);
write("sw.js",worker);


// Canonical and sitemap are only generated after the real origin is configured.
if(process.env.SITE_URL){
 const u=new URL(process.env.SITE_URL);
 if(u.protocol!=="https:"||u.pathname!=="/")throw Error("SITE_URL must be a bare HTTPS origin");
 const origin=u.origin;
 for(const route of ["index.html","web/index.html"]){
  const file=resolve(out,route);
  const html=readFileSync(file,"utf8");
  const canonical=origin+"/";
  writeFileSync(file,html.replace("</head>",'<link rel="canonical" href="'+canonical+'"><meta property="og:url" content="'+canonical+'"></head>'));
 }
 const urls=["/","/herr-behrens/","/lesen/","/lesen/inhaltsverzeichnis/","/lesen/gesamt/",...Array.from({length:14},(_,i)=>"/lesen/kapitel-"+String(i+2).padStart(2,"0")+"/"),"/lesen/herr-behrens/","/lesen/herr-behrens/gesamt/",...Array.from({length:7},(_,i)=>"/lesen/herr-behrens/kapitel-"+String(i+1).padStart(2,"0")+"/"),"/about/","/impressum/","/datenschutz/"];
 write("sitemap.xml",'<?xml version="1.0" encoding="utf-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(path=>"<url><loc>"+origin+path+"</loc></url>").join("")+"</urlset>");
 write("robots.txt",read("site/robots.txt")+"Sitemap: "+origin+"/sitemap.xml\n");
}

console.log("Built "+base.length+" agent events, "+staticChapters+" static chapters, "+behrensChapters+" spin-off chapters, release "+releaseId+"; no dependencies, public output only in dist/");
