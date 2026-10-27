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
 const shell=["index.html","app.js","updates.mjs","reading-mode.mjs","engine.mjs","speech.mjs","markdown.mjs","style.css","static-reader.css","manifest.webmanifest","icon.svg","icon-192.png","icon-512.png"];
 const hash=createHash("sha256").update(manifest.edition).update(Buffer.concat(shell.map(file=>readFileSync(new URL("web/"+file,root))))).update(readFileSync(new URL("index.html",root))).digest("hex").slice(0,16);
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
 const shell=["index.html","app.js","updates.mjs","reading-mode.mjs","engine.mjs","speech.mjs","markdown.mjs","style.css","static-reader.css","manifest.webmanifest","icon.svg","icon-192.png","icon-512.png"];
 const expected=createHash("sha256").update(m.edition).update(Buffer.concat(shell.map(name=>readFileSync(new URL("web/"+name,root))))).update(readFileSync(new URL("index.html",root))).digest("hex").slice(0,16);
 assert.ok(read("web/sw.js").includes("zuletzt-online-experiment-"+expected));
 assert.ok(!read("web/sw.js").includes("__CACHE_ID__"));
 assert.ok(read("sw.js").includes('"/web/reading-mode.mjs"'));
});

test("root serves the first scene, not the landing page or a detached title",()=>{
 const rootHtml=read("index.html");
 assert.match(rootHtml,/Thomas hatte seit drei Tagen nicht geduscht\./);
 assert.match(rootHtml,/<main id="reader"[\s\S]*?<article class="prose">/);
 assert.doesNotMatch(rootHtml,/Ein literarisches Experiment|Roman öffnen|fünf Abzweigungen|ein Ende/i);
 assert.ok(rootHtml.includes('src="/web/app.js"'));
 assert.ok(rootHtml.includes('href="/web/style.css"'));
 assert.ok(!rootHtml.includes('base href='));
 assert.match(read("about/index.html"),/Über dieses Buch/);
 const webHtml=read("web/index.html");
 assert.match(webHtml,/Thomas hatte seit drei Tagen nicht geduscht\./);
 assert.doesNotMatch(webHtml,/Originalmanuskript und geschriebene Varianten|Alle Wege führen später/);
 const manifest=JSON.parse(read("site.webmanifest"));
 assert.equal(manifest.start_url,"/");
 assert.equal(manifest.scope,"/");
 assert.ok(read("sw.js").includes('"/"'));
 assert.ok(!read("sw.js").includes("__CACHE_ID__"));
});


test("public legal pages contain no internal pre-release notes",()=>{
 const imprint=read("impressum/index.html");
 const privacy=read("datenschutz/index.html");
 for(const html of [imprint,privacy]){
  assert.doesNotMatch(html,/Entwurf.{0,40}vor Veröffentlichung|Vor Veröffentlichung prüfen|Vor der Veröffentlichung klären/i);
 }
 assert.match(imprint,/Redaktionell verantwortlich/);
 assert.match(privacy,/Cloudflare Pages/);
 assert.match(privacy,/Rezensionseingang ist zum Start deaktiviert/);
});

test("focus mode keeps visible end buttons and resets focus on section changes",()=>{
 const html=read("index.html");
 const css=read("web/style.css");
 const app=read("web/app.js");
 assert.match(html, /id="back"/);
 assert.match(html, /id="next"/);
 assert.match(css, /:root\[data-reading-mode="on"\] \.navigation\s*\{[\s\S]*?display:\s*flex/);
 assert.doesNotMatch(css, /:root\[data-reading-mode="on"\] \.navigation,\s*\n:root\[data-reading-mode="on"\] \.foot \{ display: none/);
 assert.match(app, /requestAnimationFrame\(\(\) => \{/);
 assert.match(app, /goToStart\(\);/);
 assert.doesNotMatch(app, /A back-turn shows the end of the preceding section/);
});

test("touch reading mode keeps swipe gestures without showing instructions",()=>{
 const html=read("index.html");
 const app=read("web/app.js");
 const css=read("web/style.css");
 assert.doesNotMatch(html,/swipe-hint|Wischen:/);
 assert.match(app,/touchstart/);
 assert.match(app,/touchend/);
 assert.match(app,/touchcancel/);
 assert.match(app,/swipeDirection/);
 assert.doesNotMatch(app,/tapDirection|reader\.addEventListener\("click"/);
 assert.match(css,/touch-action: pan-y pinch-zoom/);
 assert.doesNotMatch(css,/\.swipe-hint/);
 assert.match(html,/id="back"/);
 assert.match(html,/id="next"/);
});

test("horizontal swipes navigate scenes and keep full text scrollable",()=>{
 const app=read("web/app.js");
 const gestures=read("web/reading-mode.mjs");
 const html=read("index.html");
 assert.match(app,/sceneTurn\(/);
 assert.doesNotMatch(app,/readingStep|startScroll|maxScroll/);
 assert.match(gestures,/export function sceneTurn/);
 assert.doesNotMatch(gestures,/viewportHeight|Math\.round\(viewportHeight/);
 assert.doesNotMatch(html,/swipe-hint|Wischen:/);
});

test("focussed reader auto-hides menu only on downward scroll and reveals upward",()=>{
 const html=read("index.html");
 const css=read("web/style.css");
 const app=read("web/app.js");
 const gestures=read("web/reading-mode.mjs");
 assert.doesNotMatch(html, /swipe-hint|Wischen:/);
 assert.match(css, /data-reading-menu="hidden"/);
 assert.match(css, /visibility:\s*hidden/);
 assert.match(css, /pointer-events:\s*none/);
 assert.match(app, /scrollMenuState\(/);
 assert.match(app, /updateScrollMenu\(\)/);
 assert.match(app, /resetReadingMenu\(\)/);
 assert.match(gestures, /export function scrollMenuState/);
 assert.match(html, /id="reading-mode-toggle"/);
 assert.match(html, /id="back"/);
 assert.match(html, /id="next"/);
});

test("static reading edition is complete, semantic and navigable without JS",()=>{
 const html=[];
 for(let i=1;i<=15;i++){
  const path=i===1?"lesen/index.html":"lesen/kapitel-"+String(i).padStart(2,"0")+"/index.html";
  const content=read(path);
  html.push(content);
  assert.match(content,/<!doctype html>/i);
  assert.match(content,/<main id="text">[\s\S]*?<article/);
  assert.match(content,/<h2 class="chapter-title">/);
  assert.match(content,/<div class="prose">/);
  assert.match(content,/<nav class="chapter-nav"/);
  assert.match(content,/<a href="\/lesen\/inhaltsverzeichnis\/">Inhaltsverzeichnis<\/a>/);
  assert.doesNotMatch(content,/<script\b|onload=|onclick=|<button\b/i);
  if(i!==1)assert.match(content,/rel="prev"/);
  if(i!==15)assert.match(content,/rel="next"/);
 }
 assert.ok(html.reduce((n,s)=>n+s.length,0)>300000);
 assert.match(html[0],/Thomas hatte seit drei Tagen nicht geduscht/);
 assert.match(html.at(-1),/Er beschloss, morgen nachzusehen/);
 assert.match(read("lesen/inhaltsverzeichnis/index.html"),/kapitel-15/);
 assert.match(read("index.html"),/href="\/lesen\/"/);
});

test("reader version is embedded, served uncached and can activate only with consent",()=>{
 const version=JSON.parse(read("version.json")).version;
 const html=read("index.html");
 const worker=read("sw.js");
 const app=read("web/app.js");
 assert.match(version,/^[a-f0-9]{16}$/);
 assert.ok(html.includes('name="reader-version" content="'+version+'"'));
 assert.match(html,/id="update-banner"/);
 assert.match(html,/id="update-load"/);
 assert.match(html,/id="update-later"/);
 assert.match(app,/initUpdates\(/);
 assert.match(read("web/updates.mjs"),/registration\.update\(\)/);
 assert.match(read("web/updates.mjs"),/controllerchange/);
 assert.match(worker,/SKIP_WAITING/);
 assert.match(worker,/if\(!\(await old\.match\("\/web\/updates\.mjs"\)\)\)await self\.skipWaiting\(\)/);
 assert.match(worker,/if\(event\.data\?\.type==="SKIP_WAITING"\)/);
 assert.match(worker,/url\.pathname==="\/version\.json"/);
 assert.match(read("_headers"),/\/version\.json\s+Cache-Control: no-store/);
});

test("Android Reading Mode has one uninterrupted no-JS complete novel",()=>{
 const full=read("lesen/gesamt/index.html");
 const chapterOne=read("lesen/index.html");
 const toc=read("lesen/inhaltsverzeichnis/index.html");
 assert.match(full,/<!doctype html>/i);
 assert.match(full,/<main id="text">[\s\S]*?<article/);
 assert.match(full,/Thomas hatte seit drei Tagen nicht geduscht/);
 assert.match(full,/Er beschloss, morgen nachzusehen/);
 assert.equal((full.match(/<section aria-labelledby="full-ch[0-9]+">/g)||[]).length,15);
 assert.ok(full.length>300000);
 assert.doesNotMatch(full,/<script\b|onclick=|onload=/i);
 assert.match(chapterOne,/href="\/lesen\/gesamt\/"/);
 assert.match(toc,/href="\/lesen\/gesamt\/"/);
 assert.match(read("sw.js"),/"\/lesen\/gesamt\/"/);
});

test("share preview includes static metadata and a real JPEG",()=>{
 const html=read("index.html");
 assert.match(html,/<meta property="og:title" content="Zuletzt online – 243">/);
 assert.match(html,/<meta property="og:image" content="https:\/\/zuletzt-online-243\.pages\.dev\/og-cover\.jpg">/);
 assert.match(html,/<meta name="twitter:card" content="summary_large_image">/);
 const image=readFileSync(new URL("og-cover.jpg",root));
 assert.deepEqual([...image.subarray(0,3)],[0xff,0xd8,0xff]);
});

test("initial HTML matches the actual first interactive scene without layout collapse",async()=>{
 const {buildPages,resourcePaths}=await import("../web/engine.mjs");
 const {markdownToHtml}=await import("../web/markdown.mjs");
 const {resolve,dirname}=await import("node:path");
 const {fileURLToPath}=await import("node:url");
 const baseDir=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const manifest=JSON.parse(readFileSync(resolve(baseDir,"interaktiv/entscheidungen.json"),"utf8"));
 const resources=Object.fromEntries(resourcePaths(manifest).map(p=>[p,readFileSync(resolve(baseDir,"web",p),"utf8")]));
 const first=buildPages(manifest,resources,{})[0];
 const second=buildPages(manifest,resources,{})[1];
 const expected='<article class="prose">'+markdownToHtml(first.markdown)+'</article>';
 const html=read("index.html");
 const legacy=read("web/index.html");
 assert.ok(html.includes(expected),"SSR scene must match runtime render exactly");
 assert.ok(legacy.includes(expected),"legacy /web/ SSR must also match");
 assert.ok(!first.markdown.includes(second.markdown),"first scene cannot contain next scene");
 assert.match(html,/<html[^>]*data-reading-mode="on"/);
 assert.match(legacy,/<html[^>]*data-reading-mode="on"/);
 assert.match(html,/<noscript>[\s\S]*?href="\/lesen\/"/);
 assert.match(html,/id="reading-mode-toggle"[^>]*aria-pressed="true"/);
});

test("llms.txt provides real Markdown resource links including accessible reading",()=>{
 const llms=read("llms.txt");
 assert.match(llms,/^#\s+\S/m);
 assert.ok(llms.length>50);
 assert.match(llms,/\[[^\]]+\]\(\/agent\/v1\/manifest\.json\)/);
 assert.match(llms,/\[[^\]]+\]\(\/lesen\/gesamt\/\)/);
 assert.match(llms,/243/);
});

test("well-known discovery advertises only the real JSON story feed",()=>{
 const old=JSON.parse(read(".well-known/ai-catalog.json"));
 const current=JSON.parse(read(".well-known/ard.json"));
 assert.deepEqual(old,current);
 assert.equal(old.specVersion,"1.0");
 assert.ok(typeof old.host.displayName==="string" && !!old.host.displayName);
 assert.ok(Array.isArray(old.entries));
 assert.equal(old.entries.length,1);
 const entry=old.entries[0];
 assert.match(entry.identifier,/^urn:air:[a-zA-Z0-9.-]+(:[a-zA-Z0-9._-]+)+$/);
 assert.equal(entry.type,"application/json");
 assert.equal(new URL(entry.url).pathname,"/agent/v1/manifest.json");
 assert.ok(!("data" in entry));
 assert.deepEqual(Object.keys(old).sort(),["entries","host","specVersion"]);
});
