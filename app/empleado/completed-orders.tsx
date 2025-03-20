"use client"

import { useState, useEffect } from "react"
import { getOrders } from "@/lib/orders"
import { OrderCard } from "../cocina/order-card"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"
import type { Order } from "@/types/order"

export function CompletedOrders() {
  const [initialOrders, setInitialOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Usar el hook de suscripción en tiempo real para órdenes completadas
  const { data: completedOrders } = useRealtimeSubscription<Order>("orders", initialOrders, {
    filter: "status",
    filterValue: "eq.completed",
  })

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true)
      try {
        const data = await getOrders("completed")
        setInitialOrders(data)
      } catch (error) {
        console.error("Error fetching completed orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

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
        <OrderCard key={order.id} order={order} showCompleteButton={false} />
      ))}
    </div>
  )
}

