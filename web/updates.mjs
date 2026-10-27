// Explicit PWA updates: download in the background, never interrupt reading.
export function initUpdates({currentVersion, onBeforeReload=()=>{}}) {
  const banner=document.querySelector("#update-banner");
  const button=document.querySelector("#update-load");
  const later=document.querySelector("#update-later");
  if (!banner || !button || !later || !currentVersion || location.protocol==="file:") return;
  const supported="serviceWorker" in navigator;
  let registration=null;
  let serverVersion=null;
  let dismissed=false;
  let chosen=false;
  let checking=false;

  const waiting=()=>supported && !!navigator.serviceWorker.controller && !!registration?.waiting;
  function present() {
    const available=waiting() || (serverVersion && serverVersion!==currentVersion);
    banner.hidden=!available || dismissed;
    if (!banner.hidden) {
      button.disabled=supported && !!navigator.serviceWorker.controller && !waiting();
      button.textContent=button.disabled?"Wird vorbereitet …":"Jetzt laden";
    }
  }
  async function check() {
    if (checking || !navigator.onLine || document.hidden) return;
    checking=true;
    try {
      // Cache-busting also bypasses legacy cache-first workers on older installs.
      const response=await fetch("/version.json?check="+Date.now(),{cache:"no-store"});
      if(response.ok){
        const data=await response.json();
        if(typeof data.version==="string" && /^[a-f0-9]{16}$/.test(data.version))serverVersion=data.version;
      }
      if(registration)await registration.update();
    } catch { /* Offline and transient network failures leave reading untouched. */ }
    finally { checking=false;present(); }
  }
  function watchInstalling() {
    const installing=registration?.installing;
    if(!installing)return;
    installing.addEventListener("statechange",()=>{
      if(installing.state==="installed")present();
    });
  }
  later.addEventListener("click",()=>{dismissed=true;present();});
  button.addEventListener("click",async()=>{
    if(button.disabled || chosen)return;
    const nextWorker=registration?.waiting;
    onBeforeReload();
    if(nextWorker && navigator.serviceWorker.controller){
      chosen=true;
      button.disabled=true;
      button.textContent="Aktualisierung …";
      nextWorker.postMessage({type:"SKIP_WAITING"});
    }else if(!supported || !navigator.serviceWorker.controller){
      location.reload();
    }
  });
  if(supported){
    navigator.serviceWorker.addEventListener("controllerchange",()=>{
      if(chosen)location.reload();
    });
    navigator.serviceWorker.register("/sw.js",{scope:"/",updateViaCache:"none"}).then(reg=>{
      registration=reg;
      reg.addEventListener("updatefound",watchInstalling);
      watchInstalling();
      present();
      check();
    }).catch(()=>{check();});
  }else check();
  window.addEventListener("focus",check);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)check();});
  setInterval(check,15*60*1000);
}
