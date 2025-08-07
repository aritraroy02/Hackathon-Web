/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'child-health-pwa-v1';
const DATA_CACHE_NAME = 'child-health-data-v1';

// Files to cache for offline functionality
const FILES_TO_CACHE = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching offline page');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        console.log('[ServiceWorker] Installation complete');
        // Don't skip waiting to prevent immediate takeover
        return Promise.resolve();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Activation complete');
      // Don't claim clients immediately to prevent reload issues
      return Promise.resolve();
    })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for service worker updates to prevent infinite reload
  if (url.pathname.includes('sw.js') || url.pathname.includes('service-worker')) {
    event.respondWith(fetch(request));
    return;
  }

  // Handle API requests separately
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME)
        .then(cache => {
          return fetch(request)
            .then(response => {
              // If request is successful, clone and cache the response
              if (response.status === 200) {
                cache.put(request.url, response.clone());
              }
              return response;
            })
            .catch(() => {
              // If network fails, try to get from cache
              return cache.match(request);
            });
        })
    );
    return;
  }

  // Handle app shell requests
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(request).catch(() => {
          // If both cache and network fail, return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync', event.tag);
  
  if (event.tag === 'background-sync-data') {
    // Check if sync is stopped before proceeding
    if (!self.__SYNC_STOPPED__) {
      event.waitUntil(doBackgroundSync());
    } else {
      console.log('[ServiceWorker] Sync stopped, skipping background sync');
    }
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New data available',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.ico'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Child Health PWA', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      cacheUrls(event.data.urls).then(() => {
        event.ports[0].postMessage({ success: true });
      }).catch(error => {
        event.ports[0].postMessage({ error: error.message });
      })
    );
  }
  
  if (event.data && event.data.type === 'STOP_SYNC') {
    console.log('[ServiceWorker] Stopping sync due to logout');
    // Set a flag to prevent future sync operations
    self.__SYNC_STOPPED__ = true;
  }
  
  if (event.data && event.data.type === 'RESET_SYNC') {
    console.log('[ServiceWorker] Resetting sync after login');
    // Clear the sync stopped flag
    delete self.__SYNC_STOPPED__;
  }
 

});

// Helper function to perform background sync
async function doBackgroundSync() {
  try {
    console.log('[ServiceWorker] Performing background sync');
    
    // Check if sync has been stopped (e.g., during logout)
    if (self.__SYNC_STOPPED__) {
      console.log('[ServiceWorker] Sync stopped, skipping background sync');
      return;
    }
    
    // Open IndexedDB and get unsynced records
    const db = await openDB();
    const unsyncedRecords = await getUnsyncedRecords(db);
    
    if (unsyncedRecords.length === 0) {
      console.log('[ServiceWorker] No records to sync');
      return;
    }
    
    // Try to sync each record
    for (const record of unsyncedRecords) {
      // Check again before each record sync
      if (self.__SYNC_STOPPED__) {
        console.log('[ServiceWorker] Sync stopped during record processing');
        return;
      }
      
      try {
        await syncRecord(record);
        await markRecordAsSynced(db, record.id);
        console.log('[ServiceWorker] Record synced:', record.id);
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync record:', record.id, error);
      }
    }
    
    // Notify all clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      try {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          syncedCount: unsyncedRecords.length
        });
      } catch (error) {
        console.log('[ServiceWorker] Could not notify client:', error.message);
      }
    });
    
  } catch (error) {
    console.error('[ServiceWorker] Background sync failed:', error);
  }
}

// Helper function to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChildHealthPWA', 1);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Helper function to get unsynced records
function getUnsyncedRecords(db) {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(['child_records'], 'readonly');
      const store = transaction.objectStore('child_records');
      
      // Use store.getAll() instead of index to avoid index corruption issues
      const request = store.getAll();
      
      request.onsuccess = () => {
        try {
          const allRecords = request.result || [];
          const unsyncedRecords = [];
          
          // Filter for unsynced records manually
          for (const record of allRecords) {
            if (record.synced !== true) {
              unsyncedRecords.push(record);
            }
          }
          
          console.log(`[ServiceWorker] Found ${unsyncedRecords.length} unsynced records`);
          resolve(unsyncedRecords);
        } catch (processingError) {
          console.error('[ServiceWorker] Error processing records:', processingError);
          resolve([]);
        }
      };
      
      request.onerror = () => {
        console.error('[ServiceWorker] Failed to get records from IndexedDB:', request.error);
        resolve([]);
      };
      
      transaction.onerror = () => {
        console.error('[ServiceWorker] Transaction failed for records:', transaction.error);
        resolve([]);
      };
      
      // Add timeout to prevent hanging
      setTimeout(() => {
        console.warn('[ServiceWorker] Database query timeout, returning empty array');
        resolve([]);
      }, 5000);
      
    } catch (setupError) {
      console.error('[ServiceWorker] Error setting up records query:', setupError);
      resolve([]);
    }
  });
}

// Helper function to sync a record
async function syncRecord(record) {
  const response = await fetch('/api/records', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record)
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }
  
  return response.json();
}

// Helper function to mark record as synced
function markRecordAsSynced(db, recordId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['child_records'], 'readwrite');
    const store = transaction.objectStore('child_records');
    const getRequest = store.get(recordId);
    
    getRequest.onsuccess = () => {
      const record = getRequest.result;
      if (record) {
        record.synced = true;
        record.syncedAt = new Date().toISOString();
        
        const putRequest = store.put(record);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve(); // Record not found, assume already processed
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Helper function to cache URLs
async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  return cache.addAll(urls);
}

// Network detection
self.addEventListener('online', () => {
  console.log('[ServiceWorker] Device is online');
  // Only trigger background sync if not stopped
  if (!self.__SYNC_STOPPED__) {
    self.registration.sync.register('background-sync-data');
  }
});

self.addEventListener('offline', () => {
  console.log('[ServiceWorker] Device is offline');
});
