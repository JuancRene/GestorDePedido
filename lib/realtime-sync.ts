"use client"

import { createClient } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// Tipos de eventos que podemos sincronizar
export type SyncEventType = "DATE_FORMAT_UPDATE" | "ORDER_UPDATE" | "PRODUCT_UPDATE" | "CLIENT_UPDATE" | "SYSTEM_UPDATE"

// Interfaz para los eventos de sincronización
export interface SyncEvent {
  id: string
  type: SyncEventType
  data: any
  timestamp: number
  source_device_id: string
}

// Generar un ID único para este dispositivo/sesión
const generateDeviceId = () => {
  // Verificar si estamos en el servidor
  if (typeof window === "undefined") {
    return "server-side-render"
  }

  // Usar un ID existente si ya está almacenado
  const existingId = localStorage.getItem("device_id")
  if (existingId) return existingId

  // Generar un nuevo ID si no existe
  const newId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  localStorage.setItem("device_id", newId)
  return newId
}

// ID único para este dispositivo/sesión - solo se ejecuta en el cliente
export const DEVICE_ID = typeof window === "undefined" ? "server-side-render" : generateDeviceId()

// Función para enviar un evento de sincronización
export const sendSyncEvent = async (type: SyncEventType, data: any) => {
  // No ejecutar en el servidor
  if (typeof window === "undefined") {
    return false
  }

  try {
    const supabase = createClient()
    const event: Omit<SyncEvent, "id"> = {
      type,
      data,
      timestamp: Date.now(),
      source_device_id: DEVICE_ID,
    }

    // Insertar el evento en la tabla de sincronización
    const { error } = await supabase.from("sync_events").insert(event)

    if (error) {
      console.error("Error al enviar evento de sincronización:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error al enviar evento de sincronización:", error)
    return false
  }
}

// Hook para suscribirse a eventos de sincronización
export function useSyncEvents(types: SyncEventType[] = []) {
  const router = useRouter()
  const [lastEvent, setLastEvent] = useState<SyncEvent | null>(null)

  useEffect(() => {
    // No ejecutar en el servidor
    if (typeof window === "undefined") {
      return
    }

    // Suscribirse a los eventos de sincronización
    const supabase = createClient()
    const channel = supabase
      .channel("sync_events_channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sync_events",
        },
        (payload) => {
          const event = payload.new as SyncEvent

          // Ignorar eventos generados por este mismo dispositivo
          if (event.source_device_id === DEVICE_ID) {
            return
          }

          // Filtrar por tipos de eventos si se especificaron
          if (types.length > 0 && !types.includes(event.type)) {
            return
          }

          console.log("Evento de sincronización recibido:", event)
          setLastEvent(event)

          // Procesar el evento según su tipo
          handleSyncEvent(event, router)
        },
      )
      .subscribe()

    // Limpiar la suscripción al desmontar
    return () => {
      supabase.removeChannel(channel)
    }
  }, [router, types])

  return { lastEvent }
}

// Función para manejar los eventos de sincronización
function handleSyncEvent(event: SyncEvent, router: any) {
  switch (event.type) {
    case "DATE_FORMAT_UPDATE":
      // Recargar la página para aplicar los cambios de formato de fecha
      toast({
        title: "Actualización del sistema",
        description: "Se han actualizado los formatos de fecha. Recargando...",
      })
      // Esperar un momento para que el usuario vea el toast
      setTimeout(() => window.location.reload(), 2000)
      break

    case "ORDER_UPDATE":
      // Actualizar la interfaz si estamos en una página de pedidos
      toast({
        title: "Pedidos actualizados",
        description: "Se han realizado cambios en los pedidos.",
      })
      router.refresh()
      break

    case "PRODUCT_UPDATE":
      // Actualizar la interfaz si estamos en una página de productos
      toast({
        title: "Productos actualizados",
        description: "Se han realizado cambios en los productos.",
      })
      router.refresh()
      break

    case "CLIENT_UPDATE":
      // Actualizar la interfaz si estamos en una página de clientes
      toast({
        title: "Clientes actualizados",
        description: "Se han realizado cambios en los clientes.",
      })
      router.refresh()
      break

    case "SYSTEM_UPDATE":
      // Actualización general del sistema
      toast({
        title: "Actualización del sistema",
        description: event.data.message || "Se ha actualizado el sistema. Recargando...",
      })
      // Esperar un momento para que el usuario vea el toast
      setTimeout(() => window.location.reload(), 2000)
      break

    default:
      console.warn("Tipo de evento de sincronización desconocido:", event.type)
  }
}

