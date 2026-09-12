/* Quaderno di tedesco — service worker minimo.
   Mette in cache solo il guscio dell'app (HTML, manifest, icone) così che la pagina
   si apra anche offline. I dati delle lezioni NON passano di qui: l'app li chiede
   sempre alla rete e, se non c'è, ripiega sull'ultima copia salvata in localStorage. */

const CACHE = "quaderno-tedesco-v1";
const GUSCIO = ["./", "./index.html", "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(GUSCIO)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((chiavi) => Promise.all(chiavi.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Tutto ciò che non è il guscio (in primis le chiamate a Supabase) va dritto in rete.
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
  );
});
