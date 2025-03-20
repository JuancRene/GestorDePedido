"use client"

import { useEffect, useState } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { useConnectionStatus } from "@/hooks/use-connection-status"

export function OfflineStatus() {
  const { isOnline } = useConnectionStatus()
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(false)

  useEffect(() => {
    // Verificar si el Service Worker está registrado
    const checkServiceWorker = async () => {
      if ("serviceWorker" in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations()
          setIsOfflineAvailable(registrations.length > 0)
        } catch (error) {
          console.error("Error al verificar Service Worker:", error)
          setIsOfflineAvailable(false)
        }
      } else {
        setIsOfflineAvailable(false)
      }
    }

    checkServiceWorker()
  }, [])

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${isOnline ? "bg-green-100" : "bg-red-100"}`}>
        {isOnline ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
        <span className={`text-sm ${isOnline ? "text-green-600" : "text-red-600"}`}>
          {isOnline ? "En línea" : "Sin conexión"}
        </span>
        {isOfflineAvailable && !isOnline && (
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full ml-1">Modo offline activo</span>
        )}
      </div>
    </div>
  )
}

