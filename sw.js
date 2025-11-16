const CACHE_NAME = 'pharmastore-v2.0.0';
const CACHE_VERSION = 'v2';
const DATA_CACHE_NAME = `pharmastore-data-${CACHE_VERSION}`;

// List of URLs to cache
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  // Skip waiting to activate the new service worker immediately
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: App shell cached');
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  const cacheWhitelist = [CACHE_NAME, DATA_CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Handle API requests
  if (requestUrl.origin === self.location.origin) {
    // API requests
    if (requestUrl.pathname.startsWith('/api/')) {
      event.respondWith(
        fetch(event.request)
          .then((response) => {
            // If the request succeeds, cache the response
            const responseToCache = response.clone();
            caches.open(DATA_CACHE_NAME)
              .then((cache) => cache.put(event.request, responseToCache));
            return response;
          })
          .catch(() => {
            // If network fails, try to get from cache
            return caches.match(event.request);
          })
      );
      return;
    }
  }

  // For all other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If offline and no cache, return offline page for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            // For other requests, return a fallback response
            return new Response('You are offline and no cache is available.', {
              status: 408,
              statusText: 'Offline',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'sync-queue') {
    event.waitUntil(syncQueue());
  }
});

// Sync queue for offline operations
async function syncQueue() {
  // Get the queue from IndexedDB
  const queue = await getQueue();
  
  for (const item of queue) {
    try {
      // Try to send the data to the server
      const response = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item.data)
      });

      if (response.ok) {
        // If successful, remove from queue
        await removeFromQueue(item.id);
      }
    } catch (error) {
      console.error('Sync error:', error);
      // If there's an error, keep the item in the queue for next sync
    }
  }
}

// IndexedDB operations
async function getQueue() {
  return new Promise((resolve) => {
    const request = indexedDB.open('PharmaStoreDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const getAll = store.getAll();
      
      getAll.onsuccess = () => {
        resolve(getAll.result || []);
      };
    };
    
    request.onerror = () => {
      resolve([]);
    };
  });
}

async function addToQueue(item) {
  return new Promise((resolve) => {
    const request = indexedDB.open('PharmaStoreDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const addRequest = store.add(item);
      
      addRequest.onsuccess = () => {
        resolve(true);
      };
      
      addRequest.onerror = () => {
        resolve(false);
      };
    };
  });
}

async function removeFromQueue(id) {
  return new Promise((resolve) => {
    const request = indexedDB.open('PharmaStoreDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        resolve(true);
      };
      
      deleteRequest.onerror = () => {
        resolve(false);
      };
    };
  });
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_API_RESPONSE') {
    const { request, response } = event.data.payload;
    caches.open(DATA_CACHE_NAME)
      .then((cache) => cache.put(request, new Response(JSON.stringify(response))));
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
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
  // This would integrate with your Firebase backend
  console.log('Sending offline data to server:', data);
  // Implementation depends on your Firebase setup
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
