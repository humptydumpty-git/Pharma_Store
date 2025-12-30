const CACHE_NAME = 'pharmastore-v1.1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return Promise.all(
          urlsToCache.map((url) =>
            cache.add(url).catch((error) => {
              console.log('Service Worker: Failed to cache', url, error);
            })
          )
        );
      })
      .catch((error) => {
        console.log('Service Worker: Cache failed', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first for HTML, cache-first for assets
self.addEventListener('fetch', (event) => {
  console.log('Service Worker: Fetch', event.request.url);
  
  // For navigations (HTML pages), always try network first so new code deploys correctly
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache a copy of the fresh HTML
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => {
          // Fallback to cached page or offline page
          return caches.match(event.request).then((cached) => cached || caches.match('/offline.html'));
        })
    );
    return;
  }

  // For other assets, use cache-first for offline performance
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }
        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        return fetchResponse;
      });
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Sync offline data when connection is restored
      syncOfflineData()
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from PharmaStore',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('PharmaStore', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Sync offline data function
async function syncOfflineData() {
  try {
    // Get offline data from IndexedDB or localStorage
    const offlineData = await getOfflineData();
    
    if (offlineData && offlineData.length > 0) {
      // Send to server
      await sendOfflineDataToServer(offlineData);
      
      // Clear offline data
      await clearOfflineData();
      
      console.log('Service Worker: Offline data synced successfully');
    }
  } catch (error) {
    console.log('Service Worker: Sync failed', error);
  }
}

// Get offline data from storage
async function getOfflineData() {
  return new Promise((resolve) => {
    if ('indexedDB' in self) {
      // Use IndexedDB for better offline storage
      const request = indexedDB.open('PharmaStoreOffline', 1);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['offlineData'], 'readonly');
        const store = transaction.objectStore('offlineData');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          resolve(getAllRequest.result);
        };
      };
      request.onerror = () => {
        resolve([]);
      };
    } else {
      // Fallback - return empty array in service worker context
      resolve([]);
    }
  });
}

// Send offline data to server
async function sendOfflineDataToServer(data) {
  // Placeholder for future integration (e.g. Supabase Edge Function or custom API)
  console.log('Sending offline data to server (placeholder):', data);
}

// Clear offline data
async function clearOfflineData() {
  return new Promise((resolve) => {
    if ('indexedDB' in self) {
      const request = indexedDB.open('PharmaStoreOffline', 1);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['offlineData'], 'readwrite');
        const store = transaction.objectStore('offlineData');
        store.clear();
        resolve();
      };
      request.onerror = () => {
        resolve();
      };
    } else {
      resolve();
    }
  });
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_DATA') {
    // Cache important data for offline use
    caches.open(CACHE_NAME).then((cache) => {
      cache.put('/api/data', new Response(JSON.stringify(event.data.data)));
    });
  }
});
