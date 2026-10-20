// Mercearia da Esquina - suporte à instalação e funcionamento offline.
const CACHE_NAME = 'mercearia-esquina-v14-instalacao';
const CORE_ASSETS = [
  './', './index.html', './style.css', './script.js', './carrinho.js',
  './informacoes.js', './config.js', './manifest.json', './img/logo.png',
  './img/icone-app-192-v14.png', './img/icone-app-512-v14.png',
  './img/icone-app-maskable-512-v14.png', './img/icone-iphone-180-v14.png',
  './img/favicon-32-v14.png'
];
const ASSET_PATHS = new Set(CORE_ASSETS.map(path => new URL(path, self.registration.scope).pathname));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Um arquivo temporariamente indisponível não impede a instalação do SW.
    await Promise.allSettled(CORE_ASSETS.map(async path => {
      const url = new URL(path, self.registration.scope);
      const response = await fetch(url, { cache: 'reload' });
      if (!response.ok) throw new Error('Arquivo indisponível: ' + path);
      await cache.put(url, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('mercearia-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        return await caches.match(request)
          || await caches.match(new URL('./index.html', self.registration.scope))
          || await caches.match(new URL('./', self.registration.scope))
          || Response.error();
      }
    })());
    return;
  }

  if (!ASSET_PATHS.has(url.pathname)) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      return await caches.match(request)
        || await caches.match(new URL(url.pathname, url.origin))
        || Response.error();
    }
  })());
});
