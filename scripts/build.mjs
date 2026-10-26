// Zero-runtime-dependency build. Only dist/ is deployed.
import { readFileSync, mkdirSync, writeFileSync, cpSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import { buildPages, resourcePaths } from "../web/engine.mjs";
const root=resolve(import.meta.dirname,".."), out=resolve(root,"dist");
const read=p=>readFileSync(resolve(root,p),"utf8");
const write=(p,s)=>{const file=resolve(out,p);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,s)};
rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});
for(const d of ["web","manuskript"]) cpSync(resolve(root,d),resolve(out,d),{recursive:true});
write("interaktiv/entscheidungen.json",read("interaktiv/entscheidungen.json"));
const manifest=JSON.parse(read("interaktiv/entscheidungen.json"));
for(const p of resourcePaths(manifest).filter(p=>p.startsWith("../interaktiv/"))){
 const clean=p.slice(3);
 write(clean,read(clean));
}
const resources=Object.fromEntries(resourcePaths(manifest).map(p=>[p,read("web/"+p)]));
const base=buildPages(manifest,resources,{});
const versions={};
for(const node of manifest.nodes) for(const option of node.options.slice(1)){
 const pages=buildPages(manifest,resources,{[node.id]:option.id});
 if(pages.length!==base.length)throw Error("Scene count changed: "+node.id+"/"+option.id);
 versions[node.id+":"+option.id]=pages;
}
const editionHash=createHash("sha256").update(JSON.stringify(manifest)+resourcePaths(manifest).map(p=>resources[p]).join("")).digest("hex").slice(0,16);
const catalog=[];
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
 catalog.push({id:item.id,type:item.type,node_id:item.node_id||null,heading:item.heading,url:"/agent/v1/scenes/"+id+".json"});
}
const agentManifest={schema_version:1,edition:editionHash,title:"Zuletzt online",language:"de",author:"Benjamin Lam",start:catalog[0].id,scenes:catalog,decision_nodes:manifest.nodes.map(n=>({id:n.id,options:n.options.map(o=>o.id)})),review_schema:"/agent/v1/review.schema.json",review_endpoint:"/api/v1/reviews",guide:"/agent/v1/guide.json",note:"Read every scene in order. Choices select one variant; do not read unchosen variants."};
write("agent/v1/manifest.json",JSON.stringify(agentManifest));
write("agent/v1/guide.json",JSON.stringify({protocol:"zuletzt-online-reader-v1",steps:["Fetch manifest","Fetch each scene by URL in sequence","When type=choice choose exactly one option and record node_id => option id","For a scene with variants, use chosen variant if present; otherwise use text","Continue until next=null","Review only the path actually read; cite scene IDs. Do not claim independent reading if abridged."],completion:"All scenes encountered; five explicit choices",reviews:{method:"POST",url:"/api/v1/reviews",format:"application/json",auth:"Authorization: Bearer <invitation token>",schema:"/agent/v1/review.schema.json",readme:"/agent/v1/service.json"},disclosure:"Model identity, path and observations are self-reported, not cryptographic proof."}));
write("agent/v1/service.json",JSON.stringify({status:"review API is invitation-only and may be disabled",retryable_codes:["SERVICE_DISABLED","STORAGE_UNAVAILABLE","QUOTA_EXHAUSTED","UPSTREAM_UNAVAILABLE"],no_retry_codes:["INVALID_REVIEW","UNAUTHORIZED","DUPLICATE","METHOD_NOT_ALLOWED"],http_quota_behavior:"429 or 503 JSON when handled by code. If Cloudflare exhausted platform quota, its 1027 HTML page may replace JSON; treat 1027, 429, 503 and unexpected HTML as temporary unavailability. Report this to the human; never retry in a tight loop.",backoff:"If Retry-After present obey it; otherwise stop and show an actionable message. No automatic unlimited retries."}));
write("agent/v1/review.schema.json",read("api/review.schema.json"));
for(const f of ["_headers","_routes.json","robots.txt","llms.txt","index.html","impressum/index.html","datenschutz/index.html","site.webmanifest"])write(f,read("site/"+f));
console.log("Built "+base.length+" agent events, edition "+editionHash+"; no dependencies, public output only in dist/");
