// Service Worker for La Pecosa
const CACHE_NAME = "lapecosa-cache-v1"

// Resources we want to cache
const STATIC_RESOURCES = ["/", "/favicon.ico", "/manifest.json", "/offline.html"]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  self.skipWaiting() // Take control immediately

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_RESOURCES)
    }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== CACHE_NAME
            })
            .map((name) => {
              return caches.delete(name)
            }),
        )
      })
      .then(() => {
        return self.clients.claim() // Take control of all clients
      }),
  )
})

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return

  // Skip chrome-extension and non-HTTP(S) requests completely
  const url = new URL(event.request.url)
  if (event.request.url.startsWith("chrome-extension:") || !event.request.url.startsWith("http")) {
    return // Do nothing, let browser handle it
  }

  // Skip API, authentication, and admin routes
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("supabase") ||
    url.pathname.includes("auth") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/cocina") ||
    url.pathname.startsWith("/employee")
  ) {
    return // Do nothing, let browser handle it
  }

  // For navigation requests (HTML pages)
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/offline.html")
      }),
    )
    return
  }

  // For other requests (assets, etc.)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse
      }

      // Otherwise, fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          // Cache the response for future
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // If it's an image, return a placeholder
          if (event.request.destination === "image") {
            return new Response("", { status: 404 })
          }
        })
    }),
  )
})

// Handle errors
self.addEventListener("error", (event) => {
  console.error("Service worker error:", event.error)
})

