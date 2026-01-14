
const CACHE_NAME = 'fincontrol-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  // Note: index.tsx is a source file and will be compiled. 
  // Cache the compiled JS bundle if known, or rely on runtime caching for dynamic imports.
  // For this simple setup, we cache the entry point and manifest.
  '/manifest.json',
  '/icons/icon-192x192.png', // Add your actual icon paths here
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache).catch(error => {
          console.error('Service Worker: Falha ao adicionar ao cache', error);
          // Some files might not be available immediately, but let others succeed
        });
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Estratégia para navegação (HTML): Network-first com fallback para cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.log('Service Worker: Offline, servindo do cache para navegação');
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          // Optionally, return an offline page here
          return new Response('<h1>Você está offline</h1><p>Verifique sua conexão e tente novamente.</p>', {
            headers: { 'Content-Type': 'text/html' }
          });
        });
      })
    );
    return;
  }

  // Estratégia para outros recursos (assets, CDN scripts): Cache-first com fallback para Network
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retorna o recurso do cache se encontrado
      if (response) {
        // console.log('Service Worker: Servindo do cache', event.request.url);
        return response;
      }

      // Se não estiver no cache, busca da rede
      return fetch(event.request).then(fetchResponse => {
        // console.log('Service Worker: Buscando da rede e cacheando', event.request.url);
        // Abre o cache e armazena a nova requisição, se for válida
        return caches.open(CACHE_NAME).then(cache => {
          // Garante que não cacheamos respostas opacas ou que não podem ser reutilizadas
          if (fetchResponse.status === 200 && fetchResponse.type === 'basic') {
            cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        });
      }).catch(error => {
        console.error('Service Worker: Falha na busca da rede:', event.request.url, error);
        // Fallback em caso de falha de rede e não haver cache
        return new Response('Recurso não disponível offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
