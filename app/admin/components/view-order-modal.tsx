"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Order } from "@/types/order"

interface ViewOrderModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
}

export function ViewOrderModal({ isOpen, onClose, order }: ViewOrderModalProps) {
  if (!order) return null

  const createdAt = new Date(order.created_at)
  const pickupDateTime = order.pickup_date_time ? new Date(order.pickup_date_time) : null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalles del Pedido</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-1">Cliente</h3>
              <p>{order.customer}</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Fecha de creación</h3>
              <p>{format(createdAt, "PPpp", { locale: es })}</p>
            </div>
          </div>

          {/* Añadir información del empleado */}
          {order.employee_name && (
            <div className="mt-2">
              <h3 className="font-medium mb-1">Creado por</h3>
              <p>{order.employee_name}</p>
            </div>
          )}

          <div>
            <h3 className="font-medium mb-2">Productos</h3>
            <div className="space-y-2">
              {Array.isArray(order.items) ? (
                order.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between">
                      <span>{item.productName || "Producto sin nombre"}</span>
                      {item.is_by_weight || item.format_sales === "Por KG" ? (
                        <span className="font-medium">${item.basePrice}/kg</span>
                      ) : (
                        <span className="font-medium">${item.basePrice * item.quantity}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      <span>Cantidad: {item.quantity}</span>
                      {(item.is_by_weight || item.format_sales === "Por KG") && (
                        <span className="ml-2 text-amber-600">• Precio por peso</span>
                      )}
                      {item.removedIngredients && item.removedIngredients.length > 0 && (
                        <span className="ml-2">• Sin: {item.removedIngredients.join(", ")}</span>
                      )}
                      {item.notes && <div>Nota: {item.notes}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500">No hay productos en este pedido.</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-1">Tipo de entrega</h3>
              <p>{order.delivery_method === "envio" ? "Envío a domicilio" : "Retiro en local"}</p>
              {order.delivery_method === "envio" && order.delivery_address && (
                <p className="text-sm text-gray-500 mt-1">{order.delivery_address}</p>
              )}
            </div>
            <div>
              <h3 className="font-medium mb-1">
                Fecha y hora de {order.delivery_method === "envio" ? "entrega" : "retiro"}
              </h3>
              <p>{pickupDateTime ? format(pickupDateTime, "PPpp", { locale: es }) : "No especificado"}</p>
            </div>
          </div>

          {order.payment_method && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-1">Método de pago</h3>
                <p>
                  {order.payment_method === "efectivo"
                    ? "Efectivo"
                    : order.payment_method === "debito"
                      ? "Débito"
                      : order.payment_method === "credito"
                        ? "Crédito"
                        : order.payment_method === "qr"
                          ? "QR"
                          : order.payment_method}
                </p>
                {order.payment_method === "efectivo" && order.cash_amount && (
                  <p className="text-sm text-gray-500 mt-1">
                    Paga con: ${order.cash_amount}
                    <br />
                    Vuelto: ${order.cash_amount - order.total}
                  </p>
                )}
              </div>
              <div>
                <h3 className="font-medium mb-1">Total</h3>
                <p className="text-lg font-semibold">${order.total}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

