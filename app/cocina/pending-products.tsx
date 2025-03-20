"use client"

import { useState, useEffect } from "react"
import { getOrders } from "@/lib/orders"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"
import type { Order, OrderItem } from "@/types/order"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

export function PendingProducts() {
  const [initialOrders, setInitialOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Cargando productos pendientes...</p>
      </div>
    )
  }

  if (pendingOrders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No hay productos pendientes</p>
      </div>
    )
  }

  // Ordenar pedidos por hora de retiro (del más próximo al más lejano)
  const sortedOrders = [...pendingOrders].sort((a, b) => {
    const dateA = a.pickup_date_time ? new Date(a.pickup_date_time).getTime() : Number.POSITIVE_INFINITY
    const dateB = b.pickup_date_time ? new Date(b.pickup_date_time).getTime() : Number.POSITIVE_INFINITY
    return dateA - dateB
  })

  // Agrupar productos por nombre y contar cantidades
  const productCounts: Record<
    string,
    {
      count: number
      product: OrderItem
      orders: Array<{ orderId: number; pickupTime: string | null; customer: string }>
    }
  > = {}

  sortedOrders.forEach((order) => {
    if (!Array.isArray(order.items)) return

    order.items.forEach((item) => {
      const productName = item.productName || item.name || "Producto sin nombre"
      const key = `${productName}-${item.removedIngredients?.join(",") || ""}-${item.notes || ""}`

      if (!productCounts[key]) {
        productCounts[key] = {
          count: 0,
          product: item,
          orders: [],
        }
      }

      productCounts[key].count += item.quantity
      productCounts[key].orders.push({
        orderId: order.id,
        pickupTime: order.pickup_date_time,
        customer: order.customer,
      })
    })
  })

  // Convertir a array para renderizar
  const aggregatedProducts = Object.entries(productCounts).map(([key, data]) => ({
    key,
    name: data.product.productName || data.product.name || "Producto sin nombre",
    count: data.count,
    removedIngredients: data.product.removedIngredients,
    notes: data.product.notes,
    format_sales: data.product.format_sales,
    is_by_weight: data.product.is_by_weight,
    orders: data.orders,
  }))

  return (
    <div className="space-y-4">
      {aggregatedProducts.map((product) => (
        <Card key={product.key} className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span>{product.name}</span>
              <Badge className="text-lg bg-red-600 text-white">x{product.count}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {product.removedIngredients && product.removedIngredients.length > 0 && (
              <div className="text-red-600 mb-2">
                <span className="font-medium">Sin: </span>
                {product.removedIngredients.join(", ")}
              </div>
            )}
            {product.notes && (
              <div className="text-gray-700 mb-2">
                <span className="font-medium">Notas: </span>
                {product.notes}
              </div>
            )}
            <div className="mt-2 pt-2 border-t border-gray-100">
              <h4 className="text-sm font-medium mb-1">Pedidos:</h4>
              <ul className="space-y-1">
                {product.orders.map((order, idx) => (
                  <li key={idx} className="text-sm flex items-center gap-1">
                    <span className="font-medium">#{order.orderId}</span> -<span>{order.customer}</span>
                    {order.pickupTime && (
                      <span className="flex items-center text-gray-500 ml-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(order.pickupTime).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

