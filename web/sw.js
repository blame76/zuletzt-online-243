// Offline-Cache aller Manuskriptteile und aller geschriebenen Entscheidungswege.
// Der Service Worker ist bewusst auf web/ beschränkt; die von der Seite
// angefragten Texte in ../manuskript/ und ../interaktiv/ werden mitgecached.
const CACHE = "zuletzt-online-experiment-EDITION";
const SHELL = [
  "./", "./index.html", "./app.js", "./speech.mjs", "./engine.mjs",
  "./style.css", "./manifest.webmanifest", "./icon.svg",
  "../interaktiv/entscheidungen.json"
];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    try {
      const response = await fetch("../interaktiv/entscheidungen.json");
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
    await self.skipWaiting();
  })());
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
