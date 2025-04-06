// Service Worker for offline functionality

const CACHE_NAME = 'time-tracker-cache-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js',
    './js/db.js',
    './js/timer.js',
    './js/export.js',
    './js/charts.js',
    './js/encryption.js',
    './js/drive-backup.js',
    './js/generate-test-data.js',
    './manifest.json',
    // Cache Chart.js and CryptoJS from CDN
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((cacheName) => {
                    return cacheName !== CACHE_NAME;
                }).map((cacheName) => {
                    return caches.delete(cacheName);
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Helper function to check if a URL should be cached
function shouldCache(url) {
    // Only cache HTTP and HTTPS requests
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return false;
    }
    
    // Don't cache chrome-extension URLs
    if (url.startsWith('chrome-extension://')) {
        return false;
    }
    
    return true;
}

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', (event) => {
    // Skip non-http(s) schemes like chrome-extension://
    if (!shouldCache(event.request.url)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return the response from the cached version
                if (response) {
                    return response;
                }
                
                // Not in cache - fetch from network
                return fetch(event.request.clone())
                    .then((networkResponse) => {
                        // Check if we received a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        // Clone the response - one to return, one to cache
                        const responseToCache = networkResponse.clone();
                        
                        // Only cache if the URL is valid for caching
                        if (shouldCache(event.request.url)) {
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    try {
                                        cache.put(event.request, responseToCache);
                                    } catch (error) {
                                        console.error('Error caching response:', error);
                                    }
                                })
                                .catch(error => {
                                    console.error('Error opening cache:', error);
                                });
                        }
                        
                        return networkResponse;
                    })
                    .catch(() => {
                        // Network request failed, show offline page for HTML requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        
                        // Return error for other types of requests
                        return new Response('Network error', {
                            status: 408,
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-activities') {
        event.waitUntil(syncActivities());
    }
});

// Function to handle background sync
async function syncActivities() {
    try {
        // This would be where you sync with a server if needed
        console.log('Background sync executed');
        return true;
    } catch (error) {
        console.error('Background sync failed:', error);
        return false;
    }
}