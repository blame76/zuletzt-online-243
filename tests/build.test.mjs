import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync,readdirSync} from "node:fs";
const root=new URL("../dist/",import.meta.url);
const read=p=>readFileSync(new URL(p,root),"utf8");
test("build exports complete agent feed and nothing private",()=>{
 const m=JSON.parse(read("agent/v1/manifest.json"));
 assert.equal(m.decision_nodes.length,5);
 assert.ok(m.scenes.length>100);
 assert.deepEqual(m.scenes.filter(x=>x.type==="choice").map(x=>x.node_id),["kiosk","strassenbahn","tina","stadt","nordsee"]);
 for(const s of m.scenes){
  const data=JSON.parse(read(s.url.slice(1)));
  assert.equal(data.id,s.id);assert.equal(data.type,s.type);
  if(data.type==="scene")assert.ok(data.text);
 }
 assert.ok(!existsSync(new URL("docs/",root)));
 assert.ok(!existsSync(new URL("functions/",root)));
 assert.ok(!existsSync(new URL("api/",root)));
 assert.ok(read("_routes.json").includes("/api/*"));
});

test("all 243 machine-readable paths match the human story engine",async()=>{
 const {buildPages,resourcePaths}=await import("../web/engine.mjs");
 const {resolve,dirname}=await import("node:path");
 const {fileURLToPath}=await import("node:url");
 const baseDir=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const manifest=JSON.parse(readFileSync(resolve(baseDir,"interaktiv/entscheidungen.json"),"utf8"));
 const resources=Object.fromEntries(resourcePaths(manifest).map(p=>[p,readFileSync(resolve(baseDir,"web",p),"utf8")]));
 const feed=JSON.parse(read("agent/v1/manifest.json"));
 const machine=feed.scenes.map(s=>JSON.parse(read(s.url.slice(1))));
 const normalized=pages=>{
  const out=[];for(const p of pages){const prev=out.at(-1);
   if(p.type==="scene"&&prev?.type==="scene"&&p.source===prev.source&&p.heading===prev.heading)prev.markdown+="\n\n***\n\n"+p.markdown;
   else out.push({...p});
  }return out;
 };
 for(const a of ["a","b","c"])for(const b of ["a","b","c"])for(const c of ["a","b","c"])for(const d of ["a","b","c"])for(const e of ["a","b","c"]){
  const chosen=Object.fromEntries(manifest.nodes.map((node,i)=>[node.id,[a,b,c,d,e][i]]));
  const expected=normalized(buildPages(manifest,resources,chosen));
  assert.equal(machine.length,expected.length);
  for(let i=0;i<machine.length;i++){
   const m=machine[i],p=expected[i];assert.equal(m.type,p.type);
   if(m.type!=="scene")continue;
   let text=m.text;
   for(const [node,options] of Object.entries(m.variants||{}))if(options[chosen[node]])text=options[chosen[node]];
   assert.equal(text,p.markdown,"Mismatch at "+m.id+" with "+JSON.stringify(chosen));
  }
 }
});

test("PWA icons are real PNGs and SEO canonical is not invented",()=>{
 for(const size of [192,512]){
  const icon=readFileSync(new URL("web/icon-"+size+".png",root));
  assert.deepEqual([...icon.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  assert.equal(icon.readUInt32BE(16),size);
  assert.equal(icon.readUInt32BE(20),size);
 }
 assert.ok(!read("index.html").includes('rel="canonical"'));
 assert.equal(JSON.parse(read("web/manifest.webmanifest")).icons.length,2);
});
