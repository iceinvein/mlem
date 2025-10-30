// Service Worker for Convex Storage CORS Proxy
// This intercepts Convex storage requests and adds required CORS headers
// to make them compatible with COEP (Cross-Origin-Embedder-Policy)

const CACHE_NAME = 'convex-storage-v1';

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only intercept Convex storage URLs
  if (url.hostname.includes('convex.cloud') && url.pathname.includes('/api/storage/')) {
    console.log('[Service Worker] Intercepting:', url.pathname);
    
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response so we can modify headers
          const headers = new Headers(response.headers);
          
          // Add CORS headers required for COEP
          headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
          headers.set('Access-Control-Allow-Origin', '*');
          
          // Create new response with modified headers
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: headers
          });
        })
        .catch(error => {
          console.error('[Service Worker] Fetch failed:', error);
          return new Response('Service Worker fetch failed', { status: 500 });
        })
    );
  }
  // Let all other requests pass through normally
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
