// Only public write endpoint. No GET/list/moderation routes.
export const ERROR_CODES=Object.freeze({"METHOD_NOT_ALLOWED":{"status":405,"retryable":false},"SERVICE_DISABLED":{"status":503,"retryable":false},"INVALID_MEDIA_TYPE":{"status":415,"retryable":false},"PAYLOAD_TOO_LARGE":{"status":413,"retryable":false},"UNAUTHORIZED":{"status":401,"retryable":false},"INVALID_JSON":{"status":400,"retryable":false},"INVALID_REVIEW":{"status":422,"retryable":false},"EDITION_MISMATCH":{"status":409,"retryable":false},"DUPLICATE":{"status":409,"retryable":false},"MANIFEST_UNAVAILABLE":{"status":503,"retryable":true},"STORAGE_UNAVAILABLE":{"status":503,"retryable":true}});
const reply=(status,code,message,retryable=false,retry=0,extra={})=>{
 const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
 if(retry)headers["retry-after"]=String(retry);
 return new Response(JSON.stringify({ok:false,error:{code,message,retryable,retry_after_seconds:retry||null,...extra}}),{status,headers});
};
const limit=(v,n)=>typeof v==="string"&&v.length<=n&&v.trim().length>0;
const fields=(v,allowed)=>v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).every(k=>allowed.includes(k));
const shortList=(v,max,minLength=10)=>Array.isArray(v)&&v.length<=max&&v.every(x=>limit(x,500)&&x.trim().length>=minLength);
export function validateReview(d){
 if(!fields(d,["schema_version","edition","agent","reading","review"])||d.schema_version!==1||!(/^[0-9a-f]{16}$/.test(d.edition||"")))return false;
 if(!fields(d.agent,["provider","model","prompt_version"])||!limit(d.agent.provider,80)||!limit(d.agent.model,120)||d.agent.provider.trim().length<2||d.agent.model.trim().length<2||("prompt_version" in d.agent&&!limit(d.agent.prompt_version,120)))return false;
 const reading=d.reading,review=d.review;
 if(!fields(reading,["status","choices","stopped_at"])||!["completed","abandoned"].includes(reading.status))return false;
 if(!fields(reading.choices,["kiosk","strassenbahn","tina","stadt","nordsee"])||Object.values(reading.choices).some(c=>!["a","b","c"].includes(c)))return false;
 if(reading.status==="completed"&&(Object.keys(reading.choices).length!==5||"stopped_at" in reading))return false;
 if(reading.status==="abandoned"&&!/^p\d{4}$/.test(reading.stopped_at||""))return false;
 if(!fields(review,["stars","text","strengths","weaknesses","interactivity","observations"]))return false;
 if(reading.status==="completed"&&(!Number.isInteger(review.stars)||review.stars<1||review.stars>5))return false;
 if(reading.status==="abandoned"&&review.stars!==null&&review.stars!==undefined)return false;
 if(!limit(review.text,4000)||review.text.trim().length<80||!shortList(review.strengths,5)||!shortList(review.weaknesses,5))return false;
 if(!limit(review.interactivity,1200)||review.interactivity.trim().length<20)return false;
 if(!Array.isArray(review.observations)||review.observations.length<(reading.status==="completed"?2:1)||review.observations.length>8)return false;
 if(reading.status==="completed"&&(!review.strengths.length||!review.weaknesses.length))return false;
 if(!review.observations.every(o=>fields(o,["scene_id","finding"])&&/^p\d{4}$/.test(o.scene_id||"")&&limit(o.finding,600)&&o.finding.trim().length>=20))return false;
 return true;
}
function validationDetails(d){
 const issues=[];
 const add=(path,rule)=>issues.push({path,rule});
 if(!d||typeof d!=="object")add("$","expected_object");
 if(d?.reading?.status==="completed"){
  for(const name of ["kiosk","strassenbahn","tina","stadt","nordsee"])if(!["a","b","c"].includes(d.reading.choices?.[name]))add("reading.choices."+name,"required_choice");
  if("stopped_at" in d.reading)add("reading.stopped_at","not_allowed_when_completed");
  if(!Number.isInteger(d.review?.stars)||d.review.stars<1||d.review.stars>5)add("review.stars","integer_1_to_5");
  if((d.review?.observations?.length||0)<2)add("review.observations","min_2");
 }else if(d?.reading?.status==="abandoned"){
  if(!/^p\d{4}$/.test(d.reading.stopped_at||""))add("reading.stopped_at","required_scene_id");
  if(d.review?.stars!==null&&d.review?.stars!==undefined)add("review.stars","must_be_null_or_absent");
 }
 if(!Array.isArray(d?.review?.observations))add("review.observations","required_array");
 if(!issues.length)add("$","check_schema_field_types_lengths_and_required_properties");
 return issues.slice(0,12);
}
async function fingerprint(s){
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
 return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
export async function onRequest({request,env}){
 if(request.method!=="POST")return reply(405,"METHOD_NOT_ALLOWED","Use POST with application/json; no public read endpoint.");
 if(env.REVIEW_ENABLED!=="true"||!env.REVIEWS||!env.REVIEW_TOKEN_HASHES)return reply(503,"SERVICE_DISABLED","Rezensionseingang ist derzeit nicht freigeschaltet.",false,0);
 if(!(request.headers.get("content-type")||"").toLowerCase().startsWith("application/json"))return reply(415,"INVALID_MEDIA_TYPE","Use application/json.");
 const length=Number(request.headers.get("content-length")||0);
 if(length>16384)return reply(413,"PAYLOAD_TOO_LARGE","Maximum 16 KiB.");
 const auth=request.headers.get("authorization")||"";
 if(!/^Bearer [A-Za-z0-9_-]{24,128}$/.test(auth))return reply(401,"UNAUTHORIZED","Valid invitation bearer token required.");
 const hash=await fingerprint(auth.slice(7));
 const tokens=env.REVIEW_TOKEN_HASHES.split(",").map(s=>s.trim().toLowerCase()).filter(s=>/^[0-9a-f]{64}$/.test(s));
 let accepted=0;
 for(const t of tokens){let diff=0;for(let i=0;i<64;i++)diff|=t.charCodeAt(i)^hash.charCodeAt(i);accepted|=(diff===0)?1:0;}
 if(!accepted)return reply(401,"UNAUTHORIZED","Invalid invitation token.");
 let raw="";
 try {
  if(request.body&&typeof request.body.getReader === "function"){
   const reader=request.body.getReader();let count=0;const chunks=[];
   while(true){const {done,value}=await reader.read();if(done)break;count+=value.byteLength;if(count>16384){reader.cancel().catch(()=>{});return reply(413,"PAYLOAD_TOO_LARGE","Maximum 16 KiB.");}chunks.push(value);}
   const all=new Uint8Array(count);let at=0;for(const c of chunks){all.set(c,at);at+=c.byteLength;}raw=new TextDecoder("utf-8",{fatal:true}).decode(all);
  }else raw=await request.text();
 }catch{return reply(400,"INVALID_JSON","Unable to read UTF-8 JSON body.");}
 let input;try{input=JSON.parse(raw)}catch{return reply(400,"INVALID_JSON","Malformed JSON.");}
 if(!validateReview(input))return reply(422,"INVALID_REVIEW","Review does not meet v1 schema. Check /agent/v1/review.schema.json.",false,0,{details:validationDetails(input)});
 // Resolve the edition and valid scene identifiers from the deployed static build.
 // A stale manually entered edition cannot accidentally reject every review.
 let publication;
 try {
   if(!env.ASSETS||typeof env.ASSETS.fetch!=="function")throw Error("No static assets binding");
   const result=await env.ASSETS.fetch(new URL("/agent/v1/manifest.json",request.url).toString());
   if(!result.ok)throw Error("Manifest unavailable");
   publication=await result.json();
   if(!/^[0-9a-f]{16}$/.test(publication.edition||"")||!Array.isArray(publication.scenes))throw Error("Manifest invalid");
 }catch{return reply(503,"MANIFEST_UNAVAILABLE","Die Buchfassung konnte derzeit nicht überprüft werden.",true,3600);}
 if(input.edition!==publication.edition)return reply(409,"EDITION_MISMATCH","Review refers to a different book edition. Fetch current agent manifest.");
 const validIds=new Set(publication.scenes.filter(s=>s.type==="scene").map(s=>s.id));
 const bad=input.review.observations.filter(o=>!validIds.has(o.scene_id));
 if(bad.length)return reply(422,"INVALID_REVIEW","Observations must reference readable scene IDs from the current manifest.",false,0,{details:bad.map(o=>({path:"review.observations.scene_id",rule:"unknown_or_nonreading_scene",value:o.scene_id}))});
 if(input.reading.status==="abandoned"&&!publication.scenes.some(s=>s.id===input.reading.stopped_at))return reply(422,"INVALID_REVIEW","Unknown stopped_at scene ID.",false,0,{details:[{path:"reading.stopped_at",rule:"unknown_scene"}]});
 // Single-key write avoids a partial review/used-token transaction.
 // KV is eventually consistent: concurrent submissions are not atomic.
 const reviewKey="pending:"+hash;
 try{
   if(await env.REVIEWS.get(reviewKey))return reply(409,"DUPLICATE","This invitation has already submitted a review.");
   const id=crypto.randomUUID();
   const row={id,received_at:new Date().toISOString(),status:"pending",submission:input};
   await env.REVIEWS.put(reviewKey,JSON.stringify(row),{expirationTtl:7776000});
   return new Response(JSON.stringify({ok:true,receipt:id,status:"pending",published:false}),{status:202,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"}});
 }catch{
   return reply(503,"STORAGE_UNAVAILABLE","Rezensionen können derzeit wegen eines Speicher- oder Tariflimits nicht angenommen werden. Bitte dem Auftraggeber melden.",true,3600);
 }
}
