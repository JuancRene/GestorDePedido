"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface CustomerOrder {
  id: number
  date: string
  total: number
  items: Array<{
    productName?: string
    name?: string
    quantity: number
    price?: number
    basePrice?: number
    notes?: string
    removedIngredients?: string[]
  }>
  payment_method: string
  delivery_method: string
}

interface CustomerDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  customer: {
    name: string
    totalOrders: number
    totalSpent: number
    orders: CustomerOrder[]
  } | null
}

export function CustomerDetailsModal({ isOpen, onClose, customer }: CustomerDetailsModalProps) {
  if (!customer) return null

  // Calculate statistics
  const avgOrderValue = customer.totalSpent / customer.totalOrders
  const paymentMethods = customer.orders.reduce(
    (acc, order) => {
      const method = order.payment_method || "No especificado"
      acc[method] = (acc[method] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const deliveryMethods = customer.orders.reduce(
    (acc, order) => {
      const method = order.delivery_method || "No especificado"
      acc[method] = (acc[method] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Get most ordered products
  const productCounts = customer.orders.reduce(
    (acc, order) => {
      order.items.forEach((item) => {
        const key = item.productName
        if (!acc[key]) {
          acc[key] = {
            count: 0,
            total: 0,
            variations: [] as string[],
          }
        }
        acc[key].count += item.quantity
        acc[key].total += item.price * item.quantity
        if (item.removedIngredients?.length) {
          acc[key].variations.push(`Sin: ${item.removedIngredients.join(", ")}`)
        }
        if (item.notes) {
          acc[key].variations.push(item.notes)
        }
      })
      return acc
    },
    {} as Record<string, { count: number; total: number; variations: string[] }>,
  )

  const topProducts = Object.entries(productCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detalles del Cliente: {customer.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customer.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(customer.totalSpent)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valor Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(paymentMethods).map(([method, count]) => (
                  <div key={method} className="flex justify-between items-center">
                    <span className="font-medium">
                      {method === "efectivo"
                        ? "Efectivo"
                        : method === "debito"
                          ? "Débito"
                          : method === "credito"
                            ? "Crédito"
                            : method === "qr"
                              ? "QR"
                              : method}
                    </span>
                    <Badge variant="secondary">
                      {count} ({Math.round((count / customer.totalOrders) * 100)}%)
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Métodos de Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(deliveryMethods).map(([method, count]) => (
                  <div key={method} className="flex justify-between items-center">
                    <span className="font-medium">{method === "envio" ? "Envío a domicilio" : "Retiro en local"}</span>
                    <Badge variant="secondary">
                      {count} ({Math.round((count / customer.totalOrders) * 100)}%)
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="flex-1 overflow-hidden">
          <CardHeader>
            <CardTitle>Productos Más Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-6 p-6">
                {topProducts.map(([productName, data]) => (
                  <div key={productName} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{productName}</h4>
                        <p className="text-sm text-muted-foreground">Cantidad total: {data.count}</p>
                      </div>
                      <span className="font-bold">{formatCurrency(data.total)}</span>
                    </div>
                    {data.variations.length > 0 && (
                      <div className="pl-4 border-l-2 border-muted space-y-1">
                        {Array.from(new Set(data.variations)).map((variation, i) => (
                          <p key={i} className="text-sm text-muted-foreground">
                            {variation}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Historial de Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[200px]">
              <div className="space-y-4 p-6">
                {customer.orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex justify-between items-start pb-4 border-b last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="font-medium">Pedido #{order.id}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(order.date), "PPp", {
                          locale: es,
                        })}
                      </div>
                      <div className="mt-1 space-y-1">
                        {order.items.map((item, i) => (
                          <div key={i} className="text-sm text-muted-foreground">
                            {item.quantity}x {item.productName || item.name || "Producto"}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(order.total)}</div>
                      <Badge variant="secondary" className="mt-1">
                        {order.payment_method === "efectivo" ? "Efectivo" : "Débito"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

