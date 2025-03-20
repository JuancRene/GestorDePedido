"use client"

import { useState, useEffect, useCallback } from "react"
import { getOrders } from "@/lib/orders"
import { OrderCard } from "./order-card"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"
import type { Order } from "@/types/order"

export function CompletedOrders() {
  const [initialOrders, setInitialOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Usar el hook de suscripción en tiempo real para órdenes completadas con opciones optimizadas
  const { data: completedOrders, lastUpdated } = useRealtimeSubscription<Order>("orders", initialOrders, {
    filter: "status",
    filterValue: "eq.completed",
    orderBy: "created_at",
    orderDirection: "desc",
    limit: 30, // Limitar a 30 órdenes completadas para mejor rendimiento
  })

  // Optimizar la función de carga con useCallback
  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getOrders("completed")
      setInitialOrders(data)
    } catch (error) {
      console.error("Error fetching completed orders:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()

    // Configurar un intervalo para actualizar los datos cada 5 minutos como respaldo
    const intervalId = setInterval(() => {
      fetchOrders()
    }, 300000)

    return () => clearInterval(intervalId)
  }, [fetchOrders])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Cargando pedidos completados...</p>
      </div>
    )
  }

  if (completedOrders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No hay pedidos realizados</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {completedOrders.map((order) => (
        <OrderCard key={`${order.id}-${lastUpdated.getTime()}`} order={order} showCompleteButton={false} />
      ))}
    </div>
  )
}

