import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
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

test("service worker cache key covers edition and every reader shell asset",()=>{
 const manifest=JSON.parse(read("agent/v1/manifest.json"));
 const shell=["index.html","app.js","engine.mjs","speech.mjs","markdown.mjs","style.css","manifest.webmanifest","icon.svg","icon-192.png","icon-512.png"];
 const hash=createHash("sha256").update(manifest.edition).update(Buffer.concat(shell.map(file=>readFileSync(new URL("web/"+file,root))))).digest("hex").slice(0,16);
 assert.ok(read("web/sw.js").includes("zuletzt-online-experiment-"+hash));
});

test("chapter bundles cover all agent scenes in order",()=>{
 const m=JSON.parse(read("agent/v1/manifest.json"));
 assert.equal(m.chapters.length,15);
 assert.equal(m.totals.events,m.scenes.length);
 const scenes=m.chapters.flatMap(c=>JSON.parse(read(c.url.slice(1))).scenes);
 assert.deepEqual(scenes.map(s=>s.id),m.scenes.map(s=>s.id));
 for(const [i,s] of scenes.entries())assert.equal(s.next,scenes[i+1]?.id||null);
 const example=JSON.parse(read("agent/v1/example-review.json"));
 assert.equal(example.edition,m.edition);
 assert.equal(example.reading.status,"completed");
 assert.ok(m.totals.characters_base>300000);
});
test("build excludes test sources and private repository links",()=>{
 assert.ok(!existsSync(new URL("web/tests.mjs",root)));
 assert.ok(!read("index.html").includes("github.com/blame76/zuletzt-onine-243"));
 assert.ok(!read("web/index.html").includes("github.com/benjamin-lam/zuletzt-online"));
});

test("service error declarations match the server exports",async()=>{
 const {ERROR_CODES}=await import("../functions/api/v1/reviews.js");
 const doc=JSON.parse(read("agent/v1/service.json"));
 assert.deepEqual(doc.error_codes,ERROR_CODES);
 assert.equal(doc.error_codes.SERVICE_DISABLED.retryable,false);
 assert.equal(doc.error_codes.STORAGE_UNAVAILABLE.retryable,true);
});
test("cache version fingerprints the shipped reader shell, not only text edition",async()=>{
 const {createHash}=await import("node:crypto");
 const m=JSON.parse(read("agent/v1/manifest.json"));
 const shell=["index.html","app.js","engine.mjs","speech.mjs","markdown.mjs","style.css","manifest.webmanifest","icon.svg","icon-192.png","icon-512.png"];
 const expected=createHash("sha256").update(m.edition).update(Buffer.concat(shell.map(name=>readFileSync(new URL("web/"+name,root))))).digest("hex").slice(0,16);
 assert.ok(read("web/sw.js").includes("zuletzt-online-experiment-"+expected));
 assert.ok(!read("web/sw.js").includes("__CACHE_ID__"));
});
