const CACHE_NAME = 'mercearia-esquina-v12-icones-sem-borda';
const ASSETS = ['./','./index.html','./style.css','./script.js','./carrinho.js','./informacoes.js','./config.js','./manifest.json','./img/logo.png','./img/icone-app-192.png','./img/icone-app-512.png','./img/icone-app-maskable-512.png','./img/icone-iphone-180.png','./img/favicon-32.png'];
self.addEventListener('install', e => {e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener('activate', e => {e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('mercearia-') && k !== CACHE_NAME).map(k => caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch', e => {
 const url = new URL(e.request.url);
 if (e.request.method !== 'GET' || url.origin !== self.location.origin || !ASSETS.some(a => new URL(a,self.registration.scope).pathname === url.pathname)) return;
 e.respondWith(fetch(e.request).then(r => {if(r.ok){const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy));}return r;}).catch(async()=> (await caches.match(e.request)) || Response.error()));
});
