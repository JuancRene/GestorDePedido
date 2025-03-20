"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { getOrders, updateOrderStatus } from "@/lib/orders"
import { OrderCard } from "./order-card"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"
import type { Order } from "@/types/order"
import type { OrderSortType } from "./sort-orders-control"

export function PendingOrders() {
  const [initialOrders, setInitialOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortType, setSortType] = useState<OrderSortType>("creation")

  // Usar el hook de suscripción en tiempo real para órdenes pendientes con opciones optimizadas
  const { data: pendingOrders, lastUpdated } = useRealtimeSubscription<Order>("orders", initialOrders, {
    filter: "status",
    filterValue: "in.(pending,in-progress)",
    orderBy: "created_at",
    orderDirection: "desc",
    limit: 50, // Limitar a 50 órdenes para mejor rendimiento
  })

  // Listen for sort type changes - optimizado con useCallback
  const handleSortChange = useCallback((event: CustomEvent<OrderSortType>) => {
    setSortType(event.detail)
  }, [])

  // Cargar preferencia de ordenamiento y configurar event listener
  useEffect(() => {
    // Check if there's a saved preference on initial load
    const savedSort = localStorage.getItem("kitchenOrderSort") as OrderSortType | null
    if (savedSort) {
      setSortType(savedSort)
    }

    // Add event listener for sort changes
    window.addEventListener("orderSortChanged", handleSortChange as EventListener)

    return () => {
      window.removeEventListener("orderSortChanged", handleSortChange as EventListener)
    }
  }, [handleSortChange])

  // Cargar órdenes iniciales - optimizado con useCallback
  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getOrders("pending")
      setInitialOrders(data)
    } catch (error) {
      console.error("Error fetching pending orders:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()

    // Configurar un intervalo para actualizar los datos cada 2 minutos como respaldo
    const intervalId = setInterval(() => {
      fetchOrders()
    }, 120000)

    return () => clearInterval(intervalId)
  }, [fetchOrders])

  // Ordenar las órdenes basado en el tipo de ordenamiento seleccionado - optimizado con useMemo
  const sortedOrders = useMemo(() => {
    return [...pendingOrders].sort((a, b) => {
      if (sortType === "pickup") {
        // Sort by pickup time if available
        const aPickup = a.pickup_date_time ? new Date(a.pickup_date_time) : new Date(a.created_at)
        const bPickup = b.pickup_date_time ? new Date(b.pickup_date_time) : new Date(b.created_at)
        return aPickup.getTime() - bPickup.getTime()
      } else {
        // Default sort by creation time (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
  }, [pendingOrders, sortType, lastUpdated])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Cargando pedidos pendientes...</p>
      </div>
    )
  }

  if (sortedOrders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No hay pedidos pendientes</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sortedOrders.map((order) => (
        <OrderCard
          key={`${order.id}-${lastUpdated.getTime()}`}
          order={order}
          updateStatus={updateOrderStatus}
          showCompleteButton
        />
      ))}
    </div>
  )
}

