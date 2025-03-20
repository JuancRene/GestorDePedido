// Nombre del caché
const CACHE_NAME = "la-pecosa-cache-v1"

// Archivos a cachear inicialmente
const urlsToCache = ["/", "/login", "/offline", "/styles/globals.css", "/images/logo.png"]

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cache abierto")
      return cache.addAll(urlsToCache)
    }),
  )
})

// Activación del Service Worker
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

// Estrategia de caché: Network first, falling back to cache
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, clonarla y guardarla en el caché
        if (event.request.method === "GET" && response && response.status === 200) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // Si la red falla, intentar desde el caché
        return caches.match(event.request).then((response) => {
          if (response) {
            return response
          }
          // Si no está en caché y es una navegación, mostrar página offline
          if (event.request.mode === "navigate") {
            return caches.match("/offline")
          }
          // Para otros recursos, simplemente fallar
          return new Response("Sin conexión", {
            status: 503,
            statusText: "Sin conexión",
          })
        })
      }),
  )
})

// Sincronización en segundo plano
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-orders") {
    event.waitUntil(syncOrders())
  }
})

// Función para sincronizar pedidos
async function syncOrders() {
  try {
    // Obtener datos de IndexedDB o localStorage
    const offlineData = await getOfflineData()

    if (offlineData && offlineData.length > 0) {
      // Enviar datos al servidor
      const results = await Promise.allSettled(
        offlineData.map(async (item) => {
          const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(item),
          })

          if (response.ok) {
            // Marcar como sincronizado
            return { id: item.id, success: true }
          } else {
            return { id: item.id, success: false }
          }
        }),
      )

      // Actualizar estado de sincronización
      await updateSyncStatus(results)
    }
  } catch (error) {
    console.error("Error en sincronización:", error)
  }
}

// Función para obtener datos offline (implementar según tu almacenamiento)
async function getOfflineData() {
  // Esta es una implementación de ejemplo usando localStorage
  try {
    const data = localStorage.getItem("offline_queue")
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Error al obtener datos offline:", error)
    return []
  }
}

// Función para actualizar estado de sincronización
async function updateSyncStatus(results) {
  try {
    // Implementación de ejemplo
    const successIds = results
      .filter((result) => result.status === "fulfilled" && result.value.success)
      .map((result) => result.value.id)

    // Eliminar elementos sincronizados exitosamente
    const offlineData = await getOfflineData()
    const updatedData = offlineData.filter((item) => !successIds.includes(item.id))

    localStorage.setItem("offline_queue", JSON.stringify(updatedData))
    localStorage.setItem(
      "sync_status",
      JSON.stringify({
        lastSync: new Date().toISOString(),
        pendingItems: updatedData.length,
      }),
    )

    // Notificar a la aplicación
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "SYNC_COMPLETED",
          successCount: successIds.length,
          pendingCount: updatedData.length,
        })
      })
    })
  } catch (error) {
    console.error("Error al actualizar estado de sincronización:", error)
  }
}

// Notificaciones push
self.addEventListener("push", (event) => {
  const data = event.data.json()

  const options = {
    body: data.body,
    icon: "/images/logo.png",
    badge: "/images/badge.png",
    data: {
      url: data.url || "/",
    },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Clic en notificación
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url === event.notification.data.url && "focus" in client) {
          return client.focus()
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url)
      }
    }),
  )
})

// Página offline
self.addEventListener("fetch", (event) => {
  if (
    event.request.mode === "navigate" ||
    (event.request.method === "GET" && event.request.headers.get("accept").includes("text/html"))
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/offline")
      }),
    )
  }
})

