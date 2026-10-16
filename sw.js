const CACHE_NAME = 'rube-runner-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './favicon.svg',
    './vendor/matter.min.js',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// Установка: кэшируем все ресурсы
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Активация: чистим старые версии кэша
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch: сначала кэш, потом сеть (cache-first)
self.addEventListener('fetch', event => {
    // Игнорируем запросы не GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request).then(response => {
                // Кэшируем новые ресурсы "на лету"
                if (response.ok && response.type === 'basic') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(() => caches.match('./index.html')); // fallback офлайн
        })
    );
});