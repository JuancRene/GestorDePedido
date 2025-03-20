"use client"

import { useConnectionStatus } from "@/hooks/use-connection-status"
import { useEffect, useState } from "react"
import { syncService } from "@/lib/sync-service"
import { indexedDBService } from "@/lib/indexeddb-service"
import { Wifi, WifiOff, RefreshCw, Database } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function ConnectionStatus() {
  const { isOnline, wasOffline, resetWasOffline } = useConnectionStatus()
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [syncDetails, setSyncDetails] = useState<{
    orders: number
    products: number
    customers: number
  }>({ orders: 0, products: 0, customers: 0 })

  // Actualizar contador de elementos pendientes
  const updatePendingCount = async () => {
    try {
      const count = await indexedDBService.getPendingSyncCount()
      setPendingCount(count)

      // Obtener detalles por tipo
      const syncQueue = await indexedDBService.getSyncQueue()
      const orders = syncQueue.filter((item) => item.entityType === "order").length
      const products = syncQueue.filter((item) => item.entityType === "product").length
      const customers = syncQueue.filter((item) => item.entityType === "customer").length

      setSyncDetails({ orders, products, customers })
    } catch (error) {
      console.error("Error al obtener elementos pendientes:", error)
    }
  }

  // Actualizar timestamp de última sincronización
  const updateLastSyncTime = async () => {
    try {
      const { fromServer, toServer } = await syncService.getLastSyncInfo()

      // Usar el más reciente de los dos timestamps
      const lastSync = Math.max(fromServer || 0, toServer || 0)

      if (lastSync > 0) {
        const date = new Date(lastSync)
        setLastSyncTime(
          date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        )
      }
    } catch (error) {
      console.error("Error al obtener timestamp de sincronización:", error)
    }
  }

  // Sincronizar manualmente
  const handleManualSync = async () => {
    if (!isOnline) {
      toast({
        title: "Sin conexión",
        description: "No se puede sincronizar sin conexión a Internet",
        variant: "destructive",
      })
      return
    }

    setIsSyncing(true)
    try {
      const result = await syncService.syncAll()

      toast({
        title: result.success ? "Sincronización completada" : "Sincronización parcial",
        description: result.message,
        variant: result.success ? "default" : "warning",
      })

      // Actualizar contadores y timestamp
      updatePendingCount()
      updateLastSyncTime()
    } catch (error) {
      console.error("Error durante sincronización manual:", error)
      toast({
        title: "Error de sincronización",
        description: "Ocurrió un error inesperado durante la sincronización",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Cuando cambia el estado de conexión
  useEffect(() => {
    if (isOnline && wasOffline) {
      // Cuando vuelve la conexión después de estar offline
      toast({
        title: "Conexión restablecida",
        description: "Sincronizando datos pendientes...",
        variant: "default",
      })

      setIsSyncing(true)
      syncService
        .syncAll()
        .then((result) => {
          toast({
            title: result.success ? "Sincronización completada" : "Sincronización parcial",
            description: result.message,
            variant: result.success ? "default" : "warning",
          })

          updatePendingCount()
          updateLastSyncTime()
          resetWasOffline()
          setIsSyncing(false)
        })
        .catch((error) => {
          console.error("Error durante sincronización automática:", error)
          toast({
            title: "Error de sincronización",
            description: "Ocurrió un error inesperado durante la sincronización",
            variant: "destructive",
          })
          setIsSyncing(false)
        })
    } else if (!isOnline) {
      // Cuando se pierde la conexión
      toast({
        title: "Sin conexión",
        description: "Modo offline activado. Los cambios se guardarán localmente.",
        variant: "warning",
      })
    }
  }, [isOnline, wasOffline, resetWasOffline])

  // Actualizar contadores periódicamente
  useEffect(() => {
    updatePendingCount()
    updateLastSyncTime()

    const interval = setInterval(() => {
      updatePendingCount()
    }, 30000) // Cada 30 segundos

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
          isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {isOnline ? (
          <>
            <Wifi className="h-3.5 w-3.5" />
            <span>Conectado</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5" />
            <span>Modo sin conexión</span>
          </>
        )}
      </div>

      {pendingCount > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <div className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" />
              <span>
                {pendingCount} pendiente{pendingCount !== 1 ? "s" : ""}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium">Cambios pendientes de sincronización</h4>
              <div className="text-sm space-y-1">
                {syncDetails.orders > 0 && (
                  <div className="flex justify-between">
                    <span>Pedidos:</span>
                    <span className="font-medium">{syncDetails.orders}</span>
                  </div>
                )}
                {syncDetails.products > 0 && (
                  <div className="flex justify-between">
                    <span>Productos:</span>
                    <span className="font-medium">{syncDetails.products}</span>
                  </div>
                )}
                {syncDetails.customers > 0 && (
                  <div className="flex justify-between">
                    <span>Clientes:</span>
                    <span className="font-medium">{syncDetails.customers}</span>
                  </div>
                )}
              </div>
              <div className="pt-2 text-xs text-gray-500">
                Estos cambios se sincronizarán automáticamente cuando haya conexión a Internet.
              </div>
              {isOnline && (
                <Button size="sm" className="w-full mt-2" onClick={handleManualSync} disabled={isSyncing}>
                  {isSyncing ? "Sincronizando..." : "Sincronizar ahora"}
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {lastSyncTime && <div className="text-xs text-gray-500">Última sincronización: {lastSyncTime}</div>}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing}
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              <span className="sr-only">Sincronizar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sincronizar datos manualmente</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

