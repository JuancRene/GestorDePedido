"use client"

import { useEffect } from "react"
import { useSyncEvents } from "@/lib/realtime-sync"
import { useRouter } from "next/navigation"

export function SyncManager() {
  const router = useRouter()

  // Suscribirse a todos los tipos de eventos
  const { lastEvent } = useSyncEvents()

  // Efecto para registrar cuando el componente se monta
  useEffect(() => {
    console.log("SyncManager montado - Sincronización en tiempo real activada")

    // Función para manejar cuando la ventana obtiene el foco
    const handleFocus = () => {
      console.log("Ventana enfocada - Actualizando datos")
      router.refresh()
    }

    // Añadir listener para cuando la ventana obtiene el foco
    window.addEventListener("focus", handleFocus)

    // Limpiar listener al desmontar
    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [router])

  // No renderizar nada visible
  return null
}

