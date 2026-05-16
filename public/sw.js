// Service Worker for Little Tree Aroma Reference PWA
const CACHE_NAME = 'aroma-ref-v1';
const RUNTIME_CACHE_NAME = 'aroma-ref-runtime-v1';

// Get the base path from the registration scope
const baseUrl = self.registration.scope;

// Files to precache (app shell)
const PRECACHE_URLS = [
  baseUrl,
  baseUrl + 'index.html',
  baseUrl + 'manifest.webmanifest',
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(PRECACHE_URLS).catch((err) => {
          console.warn('[SW] Precache error (some resources may be unavailable offline):', err);
          // Don't fail the install even if precache fails
          return Promise.resolve();
        });
      })
      .then(() => self.skipWaiting()),
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }).then(() => self.clients.claim()),
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle requests with the same origin
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            // Cache successful response for offline access
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version or fallback
          return caches
            .match(event.request)
            .then((response) => {
              if (response) {
                return response;
              }
              // Return the index for SPA routing
              return caches.match(baseUrl + 'index.html');
            });
        }),
    );
    return;
  }

  // Handle image requests (cache first)
  if (
    event.request.destination === 'image' ||
    url.pathname.includes('/aromas/')
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type === 'basic') {
            return response;
          }
          // Cache successful image requests
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      }),
    );
    return;
  }

  // Handle other requests (network first, fall back to cache)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches
          .match(event.request)
          .then((response) => {
            return (
              response ||
              new Response('Offline - resource not available', {
                status: 503,
                statusText: 'Service Unavailable',
              })
            );
          });
      }),
  );
});
