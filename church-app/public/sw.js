// Service worker — passes all requests through to the network.
// Supabase API calls are excluded from SW interception because
// intercepting cross-origin CORS requests in a SW can silently
// fail on some mobile browsers (headers stripped, preflight issues).

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('fetch', e => {
  const url = e.request.url

  // Let Supabase API and storage requests bypass the service worker entirely.
  // This prevents mobile browsers from mangling CORS headers on API calls.
  if (url.includes('supabase.co') || url.includes('googleapis.com')) {
    return // browser handles it natively — no respondWith()
  }

  e.respondWith(fetch(e.request))
})
