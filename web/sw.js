// Offline-Cache aller Manuskriptteile und aller geschriebenen Entscheidungswege.
// The root reader and legacy /web/ use one root-scoped Service Worker.
// All scenes and offline assets are public static files; never cache review POSTs.
const CACHE = "zuletzt-online-experiment-__CACHE_ID__";
const SHELL = [
  "/", "/web/", "/web/index.html", "/web/app.js", "/web/reading-mode.mjs", "/web/speech.mjs", "/web/engine.mjs",
  "/web/style.css", "/web/markdown.mjs", "/site.webmanifest",
  "/web/manifest.webmanifest", "/web/icon.svg", "/web/icon-192.png", "/web/icon-512.png",
  "/interaktiv/entscheidungen.json"
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
