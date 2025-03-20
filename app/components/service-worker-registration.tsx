"use client"

import { useEffect } from "react"

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // First, unregister any existing service workers
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister()
          console.log("Service Worker unregistered")
        }

        // After unregistering, register the new service worker
        window.addEventListener("load", () => {
          navigator.serviceWorker
            .register("/service-worker.js", {
              scope: "/",
            })
            .then((registration) => {
              console.log("Service Worker registered with scope:", registration.scope)
            })
            .catch((error) => {
              console.error("Service Worker registration failed:", error)
            })
        })
      })
    }
  }, [])

  return null
}

