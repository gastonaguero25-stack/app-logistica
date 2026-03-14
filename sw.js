const CACHE_NAME = 'logistica-app-v2';
const urlsToCache = [
  './',
  './index.html',
  './app.jsx',
  './manifest.json',
  './logo.png'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Obliga al SW a tomar control inmediatamente, expulsando al viejo
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Estrategia "Network First" (Primero buscar en internet, si falla, recaer en caché)
  event.respondWith(
    fetch(event.request).then(response => {
      // Si la red tiene éxito, guardamos un clon de la versión nueva en el caché escondido.
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
      return response;
    }).catch(() => {
      // Solo si el usuario se queda sin internet (modo rural/avión) entramos a usar el Caché local:
      return caches.match(event.request);
    })
  );
});
