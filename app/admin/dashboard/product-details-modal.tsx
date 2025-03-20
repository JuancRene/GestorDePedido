"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

interface ProductOrder {
  orderId: number
  date: string
  customerName: string
  quantity: number
  notes?: string
  removedIngredients?: string[]
  payment_method: string
}

interface ProductDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  product: {
    name: string
    totalSold: number
    totalRevenue: number
    averagePrice: number
    orders: ProductOrder[]
    variations: Array<{
      type: "removed" | "note"
      value: string
      count: number
    }>
  } | null
}

export function ProductDetailsModal({ isOpen, onClose, product }: ProductDetailsModalProps) {
  // Add a check for empty data
  if (!product || product.totalSold === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Detalles del Producto: {product?.name || ""}</DialogTitle>
          </DialogHeader>

          <div className="py-8 text-center">
            <p className="text-muted-foreground">No hay datos disponibles para este producto.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Calculate payment method statistics
  const paymentMethods = product.orders.reduce(
    (acc, order) => {
      const method = order.payment_method || "No especificado"
      acc[method] = (acc[method] || 0) + order.quantity
      return acc
    },
    {} as Record<string, number>,
  )

  const totalQuantity = Object.values(paymentMethods).reduce((sum, count) => sum + count, 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detalles del Producto: {product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cantidad Vendida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{product.totalSold}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(product.totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(product.averagePrice)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
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
                      {count} ({Math.round((count / totalQuantity) * 100)}%)
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Variaciones Más Comunes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {product.variations.map((variation) => (
                  <div key={`${variation.type}-${variation.value}`} className="flex justify-between items-center">
                    <span className="font-medium">{variation.value}</span>
                    <Badge variant="secondary">
                      {variation.count} ({Math.round((variation.count / product.totalSold) * 100)}
                      %)
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 flex-1 overflow-hidden">
          <CardHeader>
            <CardTitle>Historial de Pedidos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="space-y-4 p-6">
                {product.orders.map((order) => (
                  <div
                    key={order.orderId}
                    className="flex justify-between items-start pb-4 border-b last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="font-medium">Pedido #{order.orderId}</div>
                      <div className="text-sm text-muted-foreground">Cliente: {order.customerName}</div>
                      <div className="text-sm text-muted-foreground">Cantidad: {order.quantity}</div>
                      {order.removedIngredients && (
                        <div className="text-sm text-red-600">Sin: {order.removedIngredients.join(", ")}</div>
                      )}
                      {order.notes && <div className="text-sm text-muted-foreground">Nota: {order.notes}</div>}
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      {order.payment_method === "efectivo" ? "Efectivo" : "Débito"}
                    </Badge>
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

