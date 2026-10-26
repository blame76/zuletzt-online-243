// Browser speech synthesis; short utterances, no server or cloud TTS.
export class SpeechReader {
 constructor(onState=()=>{}){
  this.onState=onState;this.parts=[];this.position=0;this.active=false;this.generation=0;this.timeout=null;this.complete=null;
 }
 supported(){return "speechSynthesis" in globalThis && "SpeechSynthesisUtterance" in globalThis}
 segment(text){
  if("Segmenter" in Intl)return [...new Intl.Segmenter("de",{granularity:"sentence"}).segment(text)].map(x=>x.segment.trim()).filter(Boolean);
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(s=>s.trim()).filter(Boolean)||[];
 }
 begin(article,onComplete,position=0,speed=1){
  this.stop();this.parts=[];
  for(const element of article.querySelectorAll("h1,h2,p")){
   for(const sentence of this.segment(element.textContent||""))this.parts.push({sentence,element});
  }
  this.position=Math.max(0,Math.min(position,this.parts.length-1));this.complete=onComplete;this.speed=speed;
  if(!this.parts.length){this.onState({state:"empty",position:0});return;}
  this.active=true;this.speak();
 }
 speak(){
  if(!this.active)return;
  if(this.position>=this.parts.length){const done=this.complete;this.stop();this.onState({state:"completed",position:0});done?.();return;}
  const token=++this.generation,part=this.parts[this.position];
  for(const p of this.parts)p.element.classList.remove("speaking");
  part.element.classList.add("speaking");
  this.onState({state:"playing",position:this.position,total:this.parts.length});
  const item=new SpeechSynthesisUtterance(part.sentence);item.lang="de-DE";item.rate=this.speed;
  const voices=speechSynthesis.getVoices();item.voice=voices.find(v=>v.lang?.toLowerCase().startsWith("de")&&v.localService)||voices.find(v=>v.lang?.toLowerCase().startsWith("de"))||null;
  const finish=()=>{if(token!==this.generation||!this.active)return;clearTimeout(this.timeout);this.position++;this.speak()};
  item.onend=finish;
  item.onerror=e=>{if(token!==this.generation||!this.active)return;this.stop();this.onState({state:"error",message:"Vorlesen unterbrochen ("+(e.error||"Browser")+"). Erneut auf Wiedergabe tippen."})};
  this.timeout=setTimeout(()=>{if(token!==this.generation||!this.active)return;this.stop();this.onState({state:"error",message:"Die Sprachausgabe antwortet nicht. Bitte erneut starten."})},Math.max(45000,part.sentence.length*350));
  try{speechSynthesis.speak(item)}catch{this.stop();this.onState({state:"error",message:"Sprachausgabe derzeit nicht verfügbar."})}
 }
 pause(){
  if(!this.active)return;
  this.generation++;this.active=false;clearTimeout(this.timeout);speechSynthesis.cancel();
  for(const p of this.parts)p.element.classList.remove("speaking");
  this.onState({state:"paused",position:this.position,total:this.parts.length});
 }
 resume(){
  if(this.active||!this.parts.length)return;
  this.active=true;this.speak();
 }
 stop(){
  this.generation++;this.active=false;clearTimeout(this.timeout);
  if(this.supported())speechSynthesis.cancel();
  for(const p of this.parts)p.element.classList.remove("speaking");
 }
}
