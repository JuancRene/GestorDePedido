"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useState, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { updateOrder } from "@/lib/orders"
import type { Order } from "@/types/order"
import { MapPin } from "lucide-react"

interface EditOrderModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
  onSuccess: () => void
}

export function EditOrderModal({ isOpen, onClose, order, onSuccess }: EditOrderModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inicializar el estado con valores seguros
  const [formData, setFormData] = useState({
    delivery_method: "retiro",
    delivery_address: "",
    payment_method: "efectivo",
    cash_amount: "",
    pickup_date: "",
    pickup_time: "",
  })

  // Actualizar el estado cuando cambia la orden o se abre el modal
  useEffect(() => {
    if (order && isOpen) {
      let pickupDate = ""
      let pickupTime = ""

      if (order.pickup_date_time) {
        try {
          const date = new Date(order.pickup_date_time)
          pickupDate = date.toISOString().split("T")[0]
          pickupTime = date.toTimeString().slice(0, 5)
        } catch (error) {
          console.error("Error al procesar pickup_date_time:", error)
        }
      }

      setFormData({
        delivery_method: order.delivery_method || "retiro",
        delivery_address: order.delivery_address || "",
        payment_method: order.payment_method || "efectivo",
        cash_amount: order.cash_amount?.toString() || "",
        pickup_date: pickupDate,
        pickup_time: pickupTime,
      })
    }
  }, [order, isOpen])

  if (!order) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updateData = {
        delivery_method: formData.delivery_method as "retiro" | "envio",
        delivery_address: formData.delivery_method === "envio" ? formData.delivery_address : undefined,
        payment_method: formData.payment_method as "efectivo" | "debito",
        cash_amount:
          formData.payment_method === "efectivo" && formData.cash_amount ? Number(formData.cash_amount) : undefined,
        pickup_date_time: formData.pickup_time
          ? `${formData.pickup_date}T${formData.pickup_time}`
          : `${formData.pickup_date}T00:00:00`,
      }

      const result = await updateOrder(order.id.toString(), updateData)

      if (result.success) {
        toast({
          title: "Pedido actualizado",
          description: "El pedido ha sido actualizado exitosamente.",
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: "Error",
          description: result.message || "No se pudo actualizar el pedido",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Pedido</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-4">Tipo de Entrega</h3>
            <RadioGroup
              value={formData.delivery_method}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, delivery_method: value }))}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="retiro" id="retiro" />
                <label htmlFor="retiro" className="text-sm">
                  Retiro en local
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="envio" id="envio" />
                <label htmlFor="envio" className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Envío a domicilio
                </label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-4">Método de pago</h3>
            <RadioGroup
              value={formData.payment_method}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, payment_method: value }))}
              className="flex flex-wrap gap-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="efectivo" id="efectivo" />
                <label htmlFor="efectivo" className="text-sm">
                  $ Efectivo
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="debito" id="debito" />
                <label htmlFor="debito" className="text-sm">
                  💳 Débito
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credito" id="credito" />
                <label htmlFor="credito" className="text-sm">
                  💳 Crédito
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="qr" id="qr" />
                <label htmlFor="qr" className="text-sm">
                  📱 QR
                </label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Fecha de retiro/entrega</h3>
              <Input
                type="date"
                value={formData.pickup_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, pickup_date: e.target.value }))}
                className="w-full"
              />
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Hora de retiro/entrega (opcional)</h3>
              <Input
                type="time"
                value={formData.pickup_time}
                onChange={(e) => setFormData((prev) => ({ ...prev, pickup_time: e.target.value }))}
                className="w-full"
                placeholder="--:--"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-black hover:bg-gray-800 text-white">
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

