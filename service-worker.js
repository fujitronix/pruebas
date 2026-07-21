const CACHE_NAME = 'euskal34-cache-v13';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './data/default.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './js/storage.js',
  './js/sync.js',
  './js/checklist.js',
  './js/ui.js',
  './js/sitios.js',
  './js/countdown.js',
  './js/expenses.js',
  './js/activities.js',
  './icons/gandalf-saxo.png'
];

// Instalar el Service Worker y cachear los recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Abriendo caché y guardando recursos...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activar el Service Worker y limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar las peticiones de red
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si el recurso está en caché, devolverlo
        if (response) {
          return response;
        }
        
        // Si no, intentar obtenerlo de la red
        return fetch(event.request).then((networkResponse) => {
          // Si la respuesta no es válida, simplemente la devolvemos
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          
          // Clonar la respuesta para guardarla en caché y devolverla al navegador
          const responseToCache = networkResponse.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              // No cacheamos peticiones a APIs externas si las hubiera, solo las del mismo origen
              if (event.request.url.startsWith(self.location.origin)) {
                cache.put(event.request, responseToCache);
              }
            });
            
          return networkResponse;
        }).catch(() => {
          // Si falla la red y estamos pidiendo la página principal, devolver index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
