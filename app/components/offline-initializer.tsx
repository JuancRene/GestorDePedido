"use client"

import { useEffect, useState } from "react"
import { safeLocalStorage } from "@/lib/safe-storage"
import { useRouter } from "next/navigation"

export function OfflineInitializer() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Solo ejecutar en el navegador
    if (typeof window === "undefined") return

    const registerServiceWorker = async () => {
      if ("serviceWorker" in navigator) {
        try {
          // Verificar si el service worker ya está registrado
          const registrations = await navigator.serviceWorker.getRegistrations()
          const isRegistered = registrations.some(
            (reg) => reg.active && reg.active.scriptURL.includes("/service-worker.js"),
          )

          if (isRegistered) {
            console.log("Service Worker ya está registrado")
            setServiceWorkerRegistered(true)
            return
          }

          // Registrar con opciones específicas y manejo de errores mejorado
          const registration = await navigator.serviceWorker.register("/service-worker.js", {
            scope: "/",
            updateViaCache: "none",
          })

          console.log("Service Worker registrado con éxito:", registration)
          setServiceWorkerRegistered(true)

          // Verificar actualizaciones
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("Nueva versión disponible")
                  // Notificar al usuario sobre la actualización
                  if (confirm("Hay una nueva versión disponible. ¿Actualizar ahora?")) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        } catch (error) {
          console.error("Error al registrar el Service Worker:", error)

          // Manejo específico de errores
          if (error instanceof TypeError && error.message.includes("MIME type")) {
            console.warn("Error de MIME type. Verificando si el archivo service-worker.js existe...")

            try {
              // Verificar si el archivo existe
              const response = await fetch("/service-worker.js")
              if (!response.ok) {
                console.error(`El archivo service-worker.js no existe o no es accesible: ${response.status}`)
              } else {
                const contentType = response.headers.get("content-type")
                console.error(`El archivo service-worker.js tiene un tipo MIME incorrecto: ${contentType}`)
              }
            } catch (fetchError) {
              console.error("No se pudo verificar el archivo service-worker.js:", fetchError)
            }
          }

          // Continuar con la inicialización aunque falle el service worker
          setServiceWorkerRegistered(false)
        }
      } else {
        console.log("Service Workers no son soportados en este navegador")
        setServiceWorkerRegistered(false)
      }
    }

    const initializeApp = () => {
      try {
        // Generar ID de dispositivo único si no existe
        if (!safeLocalStorage.getItem("device_id")) {
          const deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
          safeLocalStorage.setItem("device_id", deviceId)
        }

        // Inicializar cola offline si no existe
        if (!safeLocalStorage.getItem("offline_queue")) {
          safeLocalStorage.setItem("offline_queue", JSON.stringify([]))
        }

        // Inicializar estado de sincronización si no existe
        if (!safeLocalStorage.getItem("sync_status")) {
          safeLocalStorage.setItem("sync_status", JSON.stringify({ lastSync: null, isSyncing: false }))
        }

        setIsInitialized(true)
      } catch (error) {
        console.error("Error al inicializar la aplicación:", error)
        // Intentar continuar a pesar del error
        setIsInitialized(true)
      }
    }

    // Registrar primero el service worker
    registerServiceWorker().then(() => {
      // Luego inicializar la aplicación
      initializeApp()
    })

    // Escuchar eventos online/offline
    const handleOnline = () => {
      console.log("Aplicación en línea")
      try {
        safeLocalStorage.setItem("is_online", "true")
        // Disparar sincronización al volver a estar en línea
        window.dispatchEvent(new CustomEvent("app:triggerSync"))

        // Si estábamos en la página offline, redirigir al inicio
        if (window.location.pathname === "/offline") {
          router.push("/")
        }
      } catch (error) {
        console.error("Error al manejar evento online:", error)
      }
    }

    const handleOffline = () => {
      console.log("Aplicación fuera de línea")
      try {
        safeLocalStorage.setItem("is_online", "false")
      } catch (error) {
        console.error("Error al manejar evento offline:", error)
      }
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Establecer estado online inicial
    try {
      safeLocalStorage.setItem("is_online", navigator.onLine ? "true" : "false")
    } catch (error) {
      console.error("Error al establecer estado online inicial:", error)
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [router])

  // Este componente no renderiza nada visible
  return null
}

