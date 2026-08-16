/* OPSDECK service worker — offline-first app shell */
const CACHE = "opsdeck-shell-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    fetch(self.registration.scope).then((res) => {
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("html")) return;
      return res.text().then((html) => {
        const urls = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => new URL(m[1], self.registration.scope).href);
        urls.push(self.registration.scope);
        return caches.open(CACHE).then((cache) => cache.addAll(urls));
      });
    }).catch(() => undefined)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // app shell & hashed assets: cache-first, keep fresh in background
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => cache.put(req, copy));
            }
            return res;
          })
          .catch(() => cached || caches.match(self.registration.scope));
        return cached || network;
      })
    );
    return;
  }

  // external fonts: stale-while-revalidate so offline still renders
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
