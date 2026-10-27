const CACHE_NAME = 'arzontj-v3';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/images/ad_toyota_camry_1792056773231.jpg',
  '/images/ad_iphone_15_pro_1792056804198.jpg',
  '/images/ad_dushanbe_apartment_1792056839832.jpg',
  '/images/ad_tajik_carpet_1792056885098.jpg',
  '/images/arzon_hero_dushanbe_1792056747849.jpg',
  '/images/somon_heater_appliance_1792065954779.jpg',
  '/images/somon_ev_car_1792065986929.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch(() => {
        // Continue even if some individual assets fail to precache
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (!req.url.startsWith('http')) return;

  const url = new URL(req.url);

  // Never intercept dev server, hot module reloading, or preview environment internals
  if (
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/src') ||
    url.hostname === 'localhost' ||
    url.hostname.includes('run.app') ||
    url.hostname.includes('aistudio')
  ) {
    return;
  }

  // Network-First for navigation requests (HTML pages) to prevent stale chunk 404 white screens
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match('/index.html');
          return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // Stale-While-Revalidate for static assets
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
