"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Eye, PenLine, CheckCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ViewOrderModal } from "./view-order-modal"
import { updateOrderStatus, deleteOrder } from "@/lib/orders"
import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Order } from "@/types/order"
import { EditOrderModal } from "./edit-order-modal"
import { PrintConfirmationDialog } from "@/app/components/print-confirmation-dialog"

interface OrdersTableProps {
  orders: Order[]
  onOrderUpdate: () => void
}

export function OrdersTable({ orders, onOrderUpdate }: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setIsViewModalOpen(true)
  }

  async function handleCompleteOrder(orderId: string) {
    // First, find the order and set it as selected
    const orderToComplete = orders.find((order) => order.id.toString() === orderId)
    if (orderToComplete) {
      setSelectedOrder(orderToComplete)
      setIsPrintDialogOpen(true)
    }
  }

  // Función para completar un pedido
  async function completeOrder() {
    if (!selectedOrder) return

    setIsProcessing(true)
    console.log(`Intentando completar pedido ${selectedOrder.id}`)

    const result = await updateOrderStatus(selectedOrder.id.toString(), "completed")
    setIsProcessing(false)

    if (result.success) {
      console.log(`Pedido ${selectedOrder.id} completado exitosamente`)
      toast({
        title: "Pedido completado",
        description: "El pedido ha sido marcado como completado.",
      })
      // Forzar la actualización de la lista de pedidos
      onOrderUpdate()
    } else {
      console.error(`Error al completar pedido ${selectedOrder.id}:`, result.message)
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return

    setIsProcessing(true)
    const result = await deleteOrder(selectedOrder.id.toString())
    setIsProcessing(false)
    setIsDeleteDialogOpen(false)

    if (result.success) {
      toast({
        title: "Pedido eliminado",
        description: "El pedido ha sido eliminado exitosamente.",
      })
      onOrderUpdate()
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const confirmDelete = (order: Order) => {
    setSelectedOrder(order)
    setIsDeleteDialogOpen(true)
  }

  // Añade un console.log para depuración
  console.log("Rendering OrdersTable with orders:", orders)

  if (orders.length === 0) {
    return <div className="text-center py-8 bg-white rounded-lg border">No hay pedidos para mostrar.</div>
  }

  return (
    <>
      <div className="bg-white rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Cliente</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Productos</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Total</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Detalles</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Estado</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Creado por</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => {
              const createdAt = new Date(order.created_at)
              const pickupDateTime = order.pickup_date_time ? new Date(order.pickup_date_time) : null

              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{order.customer}</td>
                  <td className="px-6 py-4">
                    {Array.isArray(order.items) ? (
                      order.items.map((item, index) => (
                        <div key={index}>
                          {item.quantity}x {item.productName || "Producto"}
                          {(item.is_by_weight || item.format_sales === "Por KG") && (
                            <span className="ml-1 text-red-600 text-xs">(${item.basePrice}/kg)</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div>No hay productos en este pedido.</div>
                    )}
                  </td>
                  <td className="px-6 py-4">${order.total}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-sm">
                      <span className="text-gray-500">{format(createdAt, "HH:mm - d/M/yyyy", { locale: es })}</span>
                      {order.payment_method && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                          {order.payment_method === "efectivo"
                            ? "Efectivo"
                            : order.payment_method === "debito"
                              ? "Débito"
                              : order.payment_method === "credito"
                                ? "Crédito"
                                : order.payment_method === "qr"
                                  ? "QR"
                                  : order.payment_method}
                        </span>
                      )}
                      {order.delivery_method === "envio" && pickupDateTime && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                          </svg>
                          Envío ({format(pickupDateTime, "d/M/yyyy, HH:mm:ss", { locale: es })})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === "completed" ? "bg-black text-white" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {order.status === "completed" ? "Completado" : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {order.employee_name ? (
                      <span className="text-sm">{order.employee_name}</span>
                    ) : (
                      <span className="text-sm text-gray-500">Admin</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleViewOrder(order)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setSelectedOrder(order)
                          setIsEditModalOpen(true)
                        }}
                      >
                        <PenLine className="h-4 w-4" />
                      </Button>
                      {order.status !== "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-black"
                          onClick={() => handleCompleteOrder(order.id.toString())}
                          disabled={isProcessing}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600"
                        onClick={() => confirmDelete(order)}
                        disabled={isProcessing}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ViewOrderModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} order={selectedOrder} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El pedido será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              className="bg-red-600 hover:bg-red-700"
              disabled={isProcessing}
            >
              {isProcessing ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <EditOrderModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        order={selectedOrder}
        onSuccess={onOrderUpdate}
      />
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

