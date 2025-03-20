"use client"

import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"
import { syncService } from "@/lib/sync-service"
import { useConnectionStatus } from "@/hooks/use-connection-status"
import { Wifi, WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { safeLocalStorage } from "@/lib/safe-storage"

export function OfflineManager() {
  const { isOnline } = useConnectionStatus()
  const [isSyncing, setIsSyncing] = useState(false)

  // Función para sincronizar datos manualmente
  const handleSync = async () => {
    if (!isOnline) {
      toast({
        title: "Sin conexión",
        description: "No se puede sincronizar sin conexión a internet.",
        variant: "destructive",
      })
      return
    }

    setIsSyncing(true)
    try {
      const result = await syncService.syncAll()
      if (result.success) {
        toast({
          title: "Sincronización completada",
          description: result.message,
        })
      } else {
        toast({
          title: "Error de sincronización",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error durante la sincronización:", error)
      toast({
        title: "Error de sincronización",
        description: "Ocurrió un error durante la sincronización.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Sincronizar automáticamente cuando se recupera la conexión
  useEffect(() => {
    if (isOnline) {
      const autoSync = async () => {
        try {
          await syncService.syncAll()
        } catch (error) {
          console.error("Error durante la sincronización automática:", error)
        }
      }

      autoSync()
    }
  }, [isOnline])

  // Guardar datos en localStorage cuando se pierde la conexión
  useEffect(() => {
    if (!isOnline && typeof window !== "undefined") {
      // Guardar la ruta actual para navegación offline
      const currentPath = window.location.pathname
      const visitedPagesStr = safeLocalStorage.getItem("visitedPages") || "[]"
      try {
        const visitedPages = JSON.parse(visitedPagesStr)
        if (!visitedPages.includes(currentPath)) {
          visitedPages.push(currentPath)
          safeLocalStorage.setItem("visitedPages", JSON.stringify(visitedPages))
        }
      } catch (error) {
        console.error("Error al procesar páginas visitadas:", error)
      }
    }
  }, [isOnline])

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${isOnline ? "bg-green-100" : "bg-red-100"}`}>
        {isOnline ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
        <span className={`text-sm ${isOnline ? "text-green-600" : "text-red-600"}`}>
          {isOnline ? "En línea" : "Sin conexión"}
        </span>
      </div>

      {isOnline && (
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 rounded-full"
          onClick={handleSync}
          disabled={isSyncing}
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "Sincronizando..." : "Sincronizar datos"}</span>
        </Button>
      )}
    </div>
  )
}

