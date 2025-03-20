"use client"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PrintTicket } from "./print-ticket"
import type { Order } from "@/types/order"

interface PrintConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  order: Order | null
  onConfirmWithoutPrint: () => void
}

export function PrintConfirmationDialog({
  isOpen,
  onClose,
  order,
  onConfirmWithoutPrint,
}: PrintConfirmationDialogProps) {
  if (!order) return null

  // Función para cerrar el diálogo
  const handleCloseDialog = () => {
    console.log("Cerrando diálogo desde handleCloseDialog")
    // Llamar a onConfirmWithoutPrint para asegurar que el pedido se marque como completado
    onConfirmWithoutPrint()
    // Usar setTimeout para asegurar que el cierre ocurra después del evento de clic
    setTimeout(() => {
      onClose()
    }, 100)
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Pedido completado</AlertDialogTitle>
          <AlertDialogDescription>
            El pedido #{order.id} ha sido marcado como completado. ¿Desea imprimir un ticket?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onConfirmWithoutPrint}>No imprimir</AlertDialogCancel>
          <PrintTicket order={order} closeDialog={handleCloseDialog} />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

