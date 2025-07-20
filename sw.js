/**
 * Service Worker for Nieves-Guadalajara Family Website
 * Provides offline functionality and performance optimizations
 */

const CACHE_NAME = 'family-website-v1';
const OFFLINE_PAGE = '/offline.html';

// Resources to cache immediately
const STATIC_RESOURCES = [
  '/',
  '/brandon/',
  '/angel/',
  '/assets/css/design-system.css',
  '/assets/css/utility-classes.css',
  '/assets/js/main.js',
  '/assets/images/icon.svg',
  '/manifest.json'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Otherwise, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            // Cache successful responses
            caches.open(CACHE_NAME)
              .then((cache) => {
                console.log('[SW] Caching new resource:', event.request.url);
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.log('[SW] Fetch failed, serving offline page:', error);
            
            // For navigation requests, serve offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_PAGE);
            }
            
            // For other requests, just fail
            throw error;
          });
      })
  );
});

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'contact-form') {
    event.waitUntil(
      syncContactForm()
    );
  }
});

async function syncContactForm() {
  try {
    // Handle any queued form submissions
    const formData = await getQueuedFormData();
    if (formData) {
      await submitFormData(formData);
      await clearQueuedFormData();
      console.log('[SW] Contact form synced successfully');
    }
  } catch (error) {
    console.error('[SW] Contact form sync failed:', error);
  }
}

// Helper functions for form data persistence
async function getQueuedFormData() {
  const cache = await caches.open('form-data');
  const response = await cache.match('/queued-form-data');
  return response ? response.json() : null;
}

async function submitFormData(formData) {
  // Submit to actual form endpoint
  return fetch('/submit-contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData)
  });
}

async function clearQueuedFormData() {
  const cache = await caches.open('form-data');
  return cache.delete('/queued-form-data');
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const options = {
    body: event.data.text(),
    icon: '/assets/images/icon-192.png',
    badge: '/assets/images/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Visit Website',
        icon: '/assets/images/visit-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/images/close-icon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Nieves-Guadalajara Family', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Update available notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
    event.ports[0].postMessage({
      type: 'UPDATE_READY'
    });
  }
});