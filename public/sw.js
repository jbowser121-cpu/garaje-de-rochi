// Service worker de El Garaje de Rochi (PWA).
// Permite instalar la app y que cargue rápido. La tienda necesita internet para
// precios/pedidos actualizados, así que usamos "network-first" y solo cacheamos
// la interfaz como respaldo.
const CACHE = "garaje-rochi-v1";
const BASE = ["/", "/index.html", "/styles.css", "/app.js", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // La API y los pedidos siempre desde la red.
  if (new URL(req.url).pathname.startsWith("/api/")) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copia = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("/index.html")))
  );
});
