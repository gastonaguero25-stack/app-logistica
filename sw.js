const CACHE_NAME = 'logistica-app-v1';
const urlsToCache = [
  '/app-logistica/',
  '/app-logistica/index.html',
  '/app-logistica/app.jsx',
  '/app-logistica/manifest.json',
  '/app-logistica/icon-192.png',
  '/app-logistica/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Si está en caché lo devolvemos
        }
        return fetch(event.request); // Si no, vamos a la red
      }
    )
  );
});
