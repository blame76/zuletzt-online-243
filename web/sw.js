// Offline-Cache aller Manuskriptteile und aller geschriebenen Entscheidungswege.
// The root reader and legacy /web/ use one root-scoped Service Worker.
// All scenes and offline assets are public static files; never cache review POSTs.
const CACHE = "zuletzt-online-experiment-__CACHE_ID__";
const SHELL = [
  "/", "/web/", "/web/index.html", "/web/app.js", "/web/reading-mode.mjs", "/web/updates.mjs", "/web/speech.mjs", "/web/engine.mjs",
  "/web/style.css", "/web/static-reader.css", "/web/markdown.mjs", "/web/spinoff-branch.mjs", "/site.webmanifest",
  "/web/manifest.webmanifest", "/web/icon.svg", "/web/icon-192.png", "/web/icon-512.png",
  "/interaktiv/entscheidungen.json", "/lesen/", "/lesen/inhaltsverzeichnis/", "/lesen/gesamt/",
  "/lesen/herr-behrens/", "/lesen/herr-behrens/gesamt/",
  ...Array.from({length:7},(_,i)=>"/lesen/herr-behrens/kapitel-"+String(i+1).padStart(2,"0")+"/")
];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    try {
      const response = await fetch("/interaktiv/entscheidungen.json");
      if (!response.ok) throw new Error("Manifest nicht erreichbar");
      const manifest = await response.json();
      const paths = new Set(manifest.manuskript.map(m => m.path));
      for (const node of manifest.nodes) {
        for (const option of node.options) if (option.scene) paths.add(option.scene);
        for (const ripple of node.ripples || []) {
          for (const path of Object.values(ripple.scenes)) paths.add(path);
        }
      }
      await cache.addAll([...paths]);
    } catch (error) { throw new Error("Offline-Buchpaket unvollständig"); }
    // Migrate automatically only from the old cache-first reader, which had
    // no update button and otherwise could strand the new worker indefinitely.
    // Later releases contain updates.mjs and remain staged until consent.
    const previous=(await caches.keys()).filter(name=>
      name.startsWith("zuletzt-online-experiment-") && name!==CACHE);
    if(previous.length){
      const old=await caches.open(previous.at(-1));
      if(!(await old.match("/web/updates.mjs")))await self.skipWaiting();
    }
  })());
});
self.addEventListener("message",event=>{
  if(event.data?.type==="SKIP_WAITING")event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith("zuletzt-online-experiment-") && name !== CACHE)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // Release metadata MUST always reach the server, never a cached response.
  if (url.pathname==="/version.json") {
    event.respondWith(fetch(event.request));
    return;
  }
  // Statically rendered chapters should show fresh published text whenever online.
  if (url.pathname.startsWith("/lesen/") && event.request.mode==="navigate") {
    event.respondWith((async()=>{
      try {
        const response=await fetch(event.request);
        if(response.ok) {
          const cache=await caches.open(CACHE);
          cache.put(event.request,response.clone()).catch(()=>{});
        }
        return response;
      }catch{
        return (await caches.match(event.request)) ||
          new Response("Diese Leseseite ist offline noch nicht gespeichert.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    const response = await fetch(event.request);
    if (response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(event.request, response.clone()).catch(() => {});
    }
    return response;
  })());
});
