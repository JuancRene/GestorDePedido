"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCustomer, updateClient } from "@/lib/clients"
import { toast } from "@/hooks/use-toast"

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  client?: {
    id: number
    name: string
    phone: string
    address: string
  }
  onSuccess: () => void
}

export function ClientModal({ isOpen, onClose, client, onSuccess }: ClientModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: client?.name || "",
    phone: client?.phone || "",
    address: client?.address || "",
    notes: "",
  })

  const isEditing = !!client

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let success
      if (isEditing && client) {
        success = await updateClient(client.id, formData)
      } else {
        success = await createCustomer(formData) // Eliminamos { ...formData, active: true }
      }

      if (success) {
        toast({
          title: isEditing ? "Cliente actualizado" : "Cliente creado",
          description: isEditing
            ? "El cliente ha sido actualizado exitosamente."
            : "El cliente ha sido creado exitosamente.",
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: "Error",
          description: isEditing
            ? "No se pudo actualizar el cliente. Intente nuevamente."
            : "No se pudo crear el cliente. Intente nuevamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error:", error)
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
          <DialogTitle>{isEditing ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Input id="notes" name="notes" value={formData.notes} onChange={handleChange} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

