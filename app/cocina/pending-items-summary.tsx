"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { getOrders } from "@/lib/orders"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"
import type { Order } from "@/types/order"
import { Utensils, Loader2 } from "lucide-react"

interface PendingItemSummary {
  name: string
  totalQuantity: number
  notes: string[]
  removedIngredients: string[][]
}

export function PendingItemsSummary() {
  const [initialOrders, setInitialOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Use the realtime subscription hook for pending orders with optimized options
  const { data: pendingOrders, lastUpdated } = useRealtimeSubscription<Order>("orders", initialOrders, {
    filter: "status",
    filterValue: "in.(pending,in-progress)",
  })

  // Optimizar la función de carga con useCallback
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
  }, [fetchOrders])

  // Memoize the aggregated items to prevent unnecessary recalculations
  const pendingItems = useMemo(() => {
    return aggregatePendingItems(pendingOrders)
  }, [pendingOrders, lastUpdated])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Artículos Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Cargando artículos pendientes...</p>
        </CardContent>
      </Card>
    )
  }

  if (pendingItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Artículos Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="text-gray-500">No hay artículos pendientes</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="h-5 w-5" />
          Artículos Pendientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingItems.map((item, index) => (
            <div
              key={`${item.name}-${index}-${lastUpdated.getTime()}`}
              className="border-b pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{item.name}</span>
                <span className="bg-red-600 text-white px-2 py-1 rounded-md text-sm font-bold">
                  x{item.totalQuantity}
                </span>
              </div>

              {/* Display special notes if any */}
              {item.notes.length > 0 && (
                <div className="mt-1">
                  <p className="text-sm font-medium text-gray-700">Notas especiales:</p>
                  <ul className="text-xs text-gray-600 ml-4 list-disc">
                    {item.notes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Display removed ingredients if any */}
              {item.removedIngredients.length > 0 && (
                <div className="mt-1">
                  <p className="text-sm font-medium text-gray-700">Sin ingredientes:</p>
                  <ul className="text-xs text-gray-600 ml-4 list-disc">
                    {item.removedIngredients.map((ingredients, i) => (
                      <li key={i}>{ingredients.join(", ")}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to aggregate items across all pending orders
function aggregatePendingItems(orders: Order[]): PendingItemSummary[] {
  const itemMap = new Map<string, PendingItemSummary>()

  orders.forEach((order) => {
    if (!Array.isArray(order.items)) return

    order.items.forEach((item) => {
      const productName = item.productName || item.name || "Producto sin nombre"

      if (!itemMap.has(productName)) {
        itemMap.set(productName, {
          name: productName,
          totalQuantity: 0,
          notes: [],
          removedIngredients: [],
        })
      }

      const summary = itemMap.get(productName)!
      summary.totalQuantity += item.quantity

      // Add notes if present
      if (item.notes) {
        summary.notes.push(item.notes)
      }

      // Add removed ingredients if present
      if (item.removedIngredients && item.removedIngredients.length > 0) {
        summary.removedIngredients.push(item.removedIngredients)
      }
    })
  })

  // Convert map to array and sort by name
  return Array.from(itemMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}

