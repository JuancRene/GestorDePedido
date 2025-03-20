"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow, format } from "date-fns"
import { es } from "date-fns/locale"
import type { Order } from "@/types/order"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, Calendar, AlertCircle, User, MapPin, CreditCard, DollarSign } from "lucide-react"
import type { OrderSortType } from "./sort-orders-control"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { PrintConfirmationDialog } from "@/app/components/print-confirmation-dialog"

interface OrderCardProps {
  order: Order
  updateStatus?: (
    orderId: string,
    status: "pending" | "in-progress" | "completed" | "cancelled",
  ) => Promise<{ success: boolean; message: string }>
  showCompleteButton: boolean
  onCompleteClick?: (order: Order) => void // Add this prop
}

export function OrderCard({ order, updateStatus, showCompleteButton, onCompleteClick }: OrderCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [sortType, setSortType] = useState<OrderSortType>("creation")
  const [progress, setProgress] = useState(0)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)

  // Calculate time remaining if pickup time exists
  const pickupDateTime = order.pickup_date_time ? new Date(order.pickup_date_time) : null
  const timeRemaining = pickupDateTime ? pickupDateTime.getTime() - new Date().getTime() : null
  const isUrgent = timeRemaining !== null && timeRemaining < 1800000 // Less than 30 minutes

  // Set progress based on status
  useEffect(() => {
    if (order.status === "pending") {
      setProgress(0)
    } else if (order.status === "in-progress") {
      setProgress(50)
    } else if (order.status === "completed") {
      setProgress(100)
    }
  }, [order.status])

  // Listen for sort type changes
  useEffect(() => {
    const handleSortChange = (event: CustomEvent<OrderSortType>) => {
      setSortType(event.detail)
    }

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
  }, [])

  const createdAt = new Date(order.created_at)
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true, locale: es })

  const formattedPickupTime = pickupDateTime
    ? pickupDateTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    : null
  const formattedPickupDate = pickupDateTime ? format(pickupDateTime, "dd/MM/yyyy", { locale: es }) : null

  async function handleMarkAsInProgress() {
    if (!updateStatus) return

    setIsUpdating(true)
    try {
      const result = await updateStatus(order.id.toString(), "in-progress")
      if (result.success) {
        // Update the order status locally to trigger UI updates
        order.status = "in-progress"
        setProgress(50)
      }
    } catch (error) {
      console.error("Error updating order status:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleMarkAsCompleted() {
    // If there's an external handler, use it
    if (onCompleteClick) {
      onCompleteClick(order)
      return
    }

    // Otherwise use the internal dialog
    setIsPrintDialogOpen(true)
  }

  // Add a new function to handle the actual completion after dialog
  async function completeOrder() {
    if (!updateStatus) return

    setIsUpdating(true)
    try {
      const result = await updateStatus(order.id.toString(), "completed")
      if (result.success) {
        // Update the order status locally to trigger UI updates
        order.status = "completed"
        setProgress(100)
      }
    } catch (error) {
      console.error("Error updating order status:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      {/* The existing card JSX */}
      <Card
        className={`hover-card transition-all overflow-hidden ${
          order.status === "completed"
            ? "bg-gray-50 border-gray-200"
            : isUrgent
              ? "bg-white border-red-300 shadow-md"
              : "bg-white border-gray-200"
        }`}
      >
        <CardHeader className="pb-2 relative">
          {isUrgent && order.status !== "completed" && (
            <div className="absolute -top-1 -right-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-red-600 text-white p-1 rounded-full animate-pulse">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>¡Urgente! Menos de 30 minutos para la entrega</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          <div className="flex justify-between items-start">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>Pedido #{order.id}</span>
              <Badge
                variant={
                  order.status === "pending" ? "outline" : order.status === "in-progress" ? "secondary" : "default"
                }
                className={
                  order.status === "completed"
                    ? "bg-green-600 text-white"
                    : order.status === "in-progress"
                      ? "bg-amber-500 text-white"
                      : "bg-red-600 text-white"
                }
              >
                {order.status === "pending"
                  ? "Pendiente"
                  : order.status === "in-progress"
                    ? "En preparación"
                    : "Completado"}
              </Badge>
            </CardTitle>
          </div>

          <Progress value={progress} className="h-1.5 mt-2" />

          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Creado {timeAgo}</span>
            </div>

            <div className="flex items-center gap-1 text-sm">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium">{order.customer}</span>
            </div>

            {/* Display pickup time with appropriate styling */}
            {pickupDateTime && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  isUrgent && order.status !== "completed" ? "text-red-600 font-medium" : "text-gray-600"
                }`}
              >
                <Clock
                  className={`w-4 h-4 ${isUrgent && order.status !== "completed" ? "text-red-600" : "text-gray-500"}`}
                />
                <span>
                  {isUrgent && order.status !== "completed" ? "¡URGENTE! " : ""}
                  Hora de retiro: {formattedPickupTime} - {formattedPickupDate}
                </span>
              </div>
            )}

            {/* Display delivery method */}
            {order.delivery_method && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                {order.delivery_method === "envio" ? (
                  <>
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>Envío a domicilio</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>Retiro en local</span>
                  </>
                )}
              </div>
            )}

            {/* Display payment method */}
            {order.payment_method && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                {order.payment_method === "efectivo" ? (
                  <>
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span>Efectivo</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span>Débito</span>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <div className="mb-2">
            <h3 className="font-medium">Artículos:</h3>
          </div>

          <ul className={`space-y-2`}>
            {order.items.map((item, index) => (
              <li
                key={index}
                className="flex justify-between items-center p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {item.name || item.productName || "Producto"}
                    {(item.is_by_weight || item.format_sales === "Por KG") && (
                      <Badge variant="outline" className="ml-2 text-xs bg-amber-100 text-amber-800 border-amber-200">
                        por peso
                      </Badge>
                    )}
                  </span>

                  {item.category && <span className="text-xs text-gray-600">{item.category || "Sin categoría"}</span>}

                  {item.notes && <span className="text-xs text-gray-600">Nota: {item.notes}</span>}

                  {item.removedIngredients && item.removedIngredients.length > 0 && (
                    <span className="text-xs text-red-600">Sin: {item.removedIngredients.join(", ")}</span>
                  )}
                </div>
                <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-300">x{item.quantity}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 p-4 bg-gray-50">
          {showCompleteButton && order.status !== "completed" && (
            <>
              {order.status === "pending" && (
                <Button
                  variant="outline"
                  onClick={handleMarkAsInProgress}
                  disabled={isUpdating}
                  className="w-full border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {isUpdating ? "Procesando..." : "Iniciar preparación"}
                </Button>
              )}

              <Button
                onClick={handleMarkAsCompleted}
                disabled={isUpdating}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isUpdating ? "Procesando..." : "Completar pedido"}
              </Button>
            </>
          )}
        </CardFooter>

        {/* Add the print dialog */}
        <PrintConfirmationDialog
          isOpen={isPrintDialogOpen}
          onClose={() => setIsPrintDialogOpen(false)}
          order={order}
          onConfirmWithoutPrint={() => {
            setIsPrintDialogOpen(false)
            completeOrder()
          }}
        />
      </Card>
    </>
  )
}

