const CACHE_NAME = 'neon-merge-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/firebase-config.js',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600;700&display=swap'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('🎮 Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache install failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🧹 Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Background sync for score submission
self.addEventListener('sync', event => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncScores());
  }
});

async function syncScores() {
  try {
    // Get pending scores from IndexedDB
    const pendingScores = await getPendingScores();
    
    if (pendingScores.length > 0) {
      // Submit each score
      for (const score of pendingScores) {
        await submitScoreToServer(score);
      }
      
      // Clear pending scores
      await clearPendingScores();
      
      // Notify user
      self.registration.showNotification('🎮 Neon Merge Rush', {
        body: 'Your scores have been synced!',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        tag: 'score-sync'
      });
    }
  } catch (error) {
    console.error('Score sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
async function getPendingScores() {
  // Implementation would connect to IndexedDB
  return [];
}

async function submitScoreToServer(score) {
  // Implementation would submit to Firebase
  return true;
}

async function clearPendingScores() {
  // Implementation would clear IndexedDB
  return true;
}

// Push notification support
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New challenge available!',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'play',
        title: 'Play Now',
        icon: '/assets/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/icons/icon-72x72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('🎮 Neon Merge Rush', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'play') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('🎮 Neon Merge Rush - Service Worker loaded!');
