const CACHE_NAME = 'fieldsync-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/script.js',
  '/logo.JPG'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', event => {
  // Only cache GET requests
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return event.respondWith(fetch(event.request));
  }
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
