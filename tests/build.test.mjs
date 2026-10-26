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
