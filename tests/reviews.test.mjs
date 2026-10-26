import test from "node:test";
import assert from "node:assert/strict";
import {onRequest,validateReview} from "../functions/api/v1/reviews.js";
const sample={schema_version:1,edition:"0123456789abcdef",agent:{provider:"Test",model:"Test model"},reading:{status:"completed",choices:{kiosk:"a",strassenbahn:"b",tina:"a",stadt:"c",nordsee:"b"}},review:{stars:3,text:"A meaningful review of the narrative and its distinctive structure, with substantive references to the specific scenes selected.",strengths:["Atmosphere develops slowly"],weaknesses:["Transitions are sometimes abrupt"],interactivity:"The perspective switches are subtle rather than outcome-changing.",observations:[{scene_id:"p0001",finding:"The early ordinary scene establishes a slow and recognizable rhythm."},{scene_id:"p0002",finding:"The second scene strengthens the tension through very small everyday choices."}]}};
test("strict submission validation",()=>{assert.equal(validateReview(sample),true);assert.equal(validateReview({...sample,evil:true}),false);assert.equal(validateReview({...sample,reading:{status:"completed",choices:{kiosk:"a"}}}),false);assert.equal(validateReview({...sample,review:{...sample.review,stars:6}}),false)});
test("review receiver is disabled without explicit configuration",async()=>{const res=await onRequest({request:new Request("https://example.test/api/v1/reviews",{method:"POST"}),env:{}});assert.equal(res.status,503);assert.equal((await res.json()).error.code,"SERVICE_DISABLED")});
test("no public reading of pending reviews",async()=>{const res=await onRequest({request:new Request("https://example.test/api/v1/reviews",{method:"GET"}),env:{}});assert.equal(res.status,405)});

test("invitation review is accepted once, then rejected",async()=>{
 const token="THIS_IS_A_SAMPLE_TEST_TOKEN_123456789012345";
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)))).map(b=>b.toString(16).padStart(2,"0")).join("");
 const m=new Map;
 const REVIEWS={get:async k=>m.get(k)||null,put:async(k,v)=>m.set(k,v)};
 const env={REVIEW_ENABLED:"true",REVIEWS,REVIEW_TOKEN_HASHES:digest,ASSETS:{fetch:async()=>new Response(JSON.stringify({edition:sample.edition,scenes:[{id:"p0001",type:"scene"},{id:"p0002",type:"scene"}]}),{status:200})}};
 const request=()=>new Request("https://example.test/api/v1/reviews",{method:"POST",headers:{"content-type":"application/json","authorization":"Bearer "+token},body:JSON.stringify(sample)});
 const a=await onRequest({request:request(),env});assert.equal(a.status,202);assert.equal((await a.json()).status,"pending");
 assert.equal([...m.keys()].filter(k=>k.startsWith("pending:")).length,1);
 const b=await onRequest({request:request(),env});assert.equal(b.status,409);assert.equal((await b.json()).error.code,"DUPLICATE");
});
test("storage quotas fail with retryable machine-readable 503",async()=>{
 const token="THIS_IS_ANOTHER_SAMPLE_TEST_TOKEN_123456789";
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)))).map(b=>b.toString(16).padStart(2,"0")).join("");
 const env={REVIEW_ENABLED:"true",REVIEWS:{get:async()=>null,put:async()=>{throw Error("quota")}},REVIEW_TOKEN_HASHES:digest,ASSETS:{fetch:async()=>new Response(JSON.stringify({edition:sample.edition,scenes:[{id:"p0001",type:"scene"},{id:"p0002",type:"scene"}]}),{status:200})}};
 const request=new Request("https://example.test/api/v1/reviews",{method:"POST",headers:{"content-type":"application/json","authorization":"Bearer "+token},body:JSON.stringify(sample)});
 const res=await onRequest({request,env});assert.equal(res.status,503);assert.equal(res.headers.get("retry-after"),"3600");const data=await res.json();assert.equal(data.error.code,"STORAGE_UNAVAILABLE");assert.equal(data.error.retryable,true);
});

test("contract status boundaries match the intended schema",async()=>{
 const schema=JSON.parse((await import("node:fs")).readFileSync(new URL("../api/review.schema.json",import.meta.url),"utf8"));
 const clauses=schema.allOf;
 assert.ok(clauses.some(x=>x.then?.properties?.reading?.properties?.choices?.required?.length===5));
 assert.ok(clauses.some(x=>x.then?.properties?.reading?.required?.includes("stopped_at")));
 assert.equal(validateReview({...sample,reading:{...sample.reading,stopped_at:"p0003"}}),false);
 assert.equal(validateReview({...sample,reading:{status:"abandoned",choices:{}},review:{...sample.review,stars:null}}),false);
 assert.equal(validateReview({...sample,reading:{status:"abandoned",choices:{},stopped_at:"p0002"},review:{...sample.review,stars:3}}),false);
});
test("review failures disclose actionable machine errors without exposing pending content",async()=>{
 const token="ANOTHER_VALID_SAMPLE_TOKEN_abcdefghijklmnop";
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token)))).map(x=>x.toString(16).padStart(2,"0")).join("");
 const env={REVIEW_ENABLED:"true",REVIEW_TOKEN_HASHES:hash,REVIEWS:{get:async()=>null,put:async()=>{}},ASSETS:{fetch:async()=>new Response(JSON.stringify({edition:sample.edition,scenes:[{id:"p0001",type:"scene"},{id:"p0002",type:"scene"}]}),{status:200})}};
 const make=(body,headers={})=>new Request("https://example.test/api/v1/reviews",{method:"POST",headers:{"content-type":"application/json","authorization":"Bearer "+token,...headers},body});
 let res=await onRequest({request:make("{invalid"),env});assert.equal(res.status,400);assert.equal((await res.json()).error.code,"INVALID_JSON");
 res=await onRequest({request:make("{}",{"content-type":"text/plain"}),env});assert.equal(res.status,415);
 res=await onRequest({request:make(JSON.stringify({...sample,reading:{...sample.reading,choices:{kiosk:"a"}}})),env});assert.equal(res.status,422);let data=await res.json();assert.equal(data.error.code,"INVALID_REVIEW");assert.ok(data.error.details.some(d=>d.path==="reading.choices.strassenbahn"));
 res=await onRequest({request:make(JSON.stringify({...sample,edition:"aaaaaaaaaaaaaaaa"})),env});assert.equal(res.status,409);assert.equal((await res.json()).error.code,"EDITION_MISMATCH");
 res=await onRequest({request:make(JSON.stringify({...sample,review:{...sample.review,observations:[{scene_id:"p9999",finding:"This is a valid-length but unknown scene observation."},sample.review.observations[1]]}})),env});assert.equal(res.status,422);assert.equal((await res.json()).error.details[0].rule,"unknown_or_nonreading_scene");
 res=await onRequest({request:make("x".repeat(17000)),env});assert.equal(res.status,413);
 res=await onRequest({request:new Request("https://example.test/api/v1/reviews",{method:"POST",headers:{"content-type":"application/json"},body:"{}"}),env});assert.equal(res.status,401);
});
