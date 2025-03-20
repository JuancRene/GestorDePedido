"use client"

import { useState, useEffect } from "react"
import { getOrders, updateOrderStatus } from "@/lib/orders"
import { OrderCard } from "../cocina/order-card"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"
import type { Order } from "@/types/order"
import { PrintConfirmationDialog } from "@/app/components/print-confirmation-dialog"

export function PendingOrders() {
  const [initialOrders, setInitialOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)

  // Usar el hook de suscripción en tiempo real para órdenes pendientes
  const { data: pendingOrders } = useRealtimeSubscription<Order>("orders", initialOrders, {
    filter: "status",
    filterValue: "in.(pending,in-progress)",
  })

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true)
      try {
        const data = await getOrders("pending")
        setInitialOrders(data)
      } catch (error) {
        console.error("Error fetching pending orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const handleCompleteOrder = (order: Order) => {
    setSelectedOrder(order)
    setIsPrintDialogOpen(true)
  }

  const completeOrder = async () => {
    if (!selectedOrder) return

    try {
      await updateOrderStatus(selectedOrder.id.toString(), "completed")
      // Refresh orders will happen automatically via realtime subscription
    } catch (error) {
      console.error("Error completing order:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Cargando pedidos pendientes...</p>
      </div>
    )
  }

  if (pendingOrders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No hay pedidos pendientes</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pendingOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            updateStatus={updateOrderStatus}
            showCompleteButton
            onCompleteClick={() => handleCompleteOrder(order)}
          />
        ))}
      </div>

      <PrintConfirmationDialog
        isOpen={isPrintDialogOpen}
        onClose={() => setIsPrintDialogOpen(false)}
        order={selectedOrder}
        onConfirmWithoutPrint={() => {
          setIsPrintDialogOpen(false)
          completeOrder()
        }}
      />
    </>
  )
}

