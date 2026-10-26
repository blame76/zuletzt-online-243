// Only public write endpoint. No GET/list/moderation routes.
const reply=(status,code,message,retryable=false,retry=0,extra={})=>{
 const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
 if(retry)headers["retry-after"]=String(retry);
 return new Response(JSON.stringify({ok:false,error:{code,message,retryable,retry_after_seconds:retry||null},...extra}),{status,headers});
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
 if(reading.status==="completed"&&Object.keys(reading.choices).length!==5)return false;
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
async function fingerprint(s){
 const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
 return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
export async function onRequest({request,env}){
 if(request.method!=="POST")return reply(405,"METHOD_NOT_ALLOWED","Use POST with application/json; no public read endpoint.");
 if(env.REVIEW_ENABLED!=="true"||!env.REVIEWS||!env.REVIEW_TOKEN_HASHES||!env.REVIEW_EDITION)return reply(503,"SERVICE_DISABLED","Rezensionseingang ist derzeit nicht freigeschaltet.",true,3600);
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
 if(!validateReview(input))return reply(422,"INVALID_REVIEW","Review does not meet v1 schema. Check /agent/v1/review.schema.json.");
 if(input.edition!==env.REVIEW_EDITION)return reply(409,"EDITION_MISMATCH","Review refers to a different book edition. Fetch current agent manifest.");
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
