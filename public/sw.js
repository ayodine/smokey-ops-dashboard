// SmokeyOps Service Worker for Rider Mobile PWA & Auto-Activation
const CACHE_NAME = 'smokeyops-shell-v20261112'
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png'
]

// 1. Install event: Pre-cache core app shell and immediately skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    }).then(() => self.skipWaiting())
  )
})

// 2. Activate event: Clean up previous cache versions & immediately claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.info('[SW] Evicting stale cache:', name)
            return caches.delete(name)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// 3. Message event: Allow programmatic skipWaiting or cache purge from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data && event.data.type === 'PURGE_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))))
    )
  }
})

// 4. Fetch event: Strict Network-First for HTML navigation; Network-first for API; Cache-aware for immutable assets
self.addEventListener('fetch', (event) => {
  const request = event.request

  // Skip non-GET requests
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // A. Navigation requests (HTML pages): Strict Network-First
  // Always fetch fresh HTML from network so bundle hashes are always current; fall back to cache only when offline
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          }
          return networkResponse
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/')
        })
    )
    return
  }

  // B. Supabase / backend API requests: Direct network pass-through with offline fallback
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api') || url.pathname.endsWith('/version.json')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ offline: true, error: 'Network unavailable' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      })
    )
    return
  }

  // C. Content-hashed static assets (JS, CSS, images, fonts): Cache-First / Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.woff2')

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone))
          }
          return networkResponse
        }).catch(() => cachedResponse)

        return cachedResponse || fetchPromise
      })
    )
    return
  }

  // Default: pass through to network
  event.respondWith(fetch(request))
})
