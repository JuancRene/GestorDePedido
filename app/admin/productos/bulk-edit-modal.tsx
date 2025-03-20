"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DollarSign, Percent } from "lucide-react"

interface BulkEditModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (priceChange: { type: "fixed" | "percentage"; value: number }) => void
  selectedCount: number
}

export function BulkEditModal({ isOpen, onClose, onConfirm, selectedCount }: BulkEditModalProps) {
  const [editType, setEditType] = useState<"fixed" | "percentage">("fixed")
  const [value, setValue] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = () => {
    if (!value || isNaN(Number(value))) return

    setIsSubmitting(true)

    try {
      onConfirm({
        type: editType,
        value: Number(value),
      })

      // Reset form
      setValue("")
      setEditType("fixed")
      onClose()
    } catch (error) {
      console.error("Error in bulk edit:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar precios en lote</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-500 mb-4">
            Está a punto de modificar el precio de <strong>{selectedCount}</strong> productos.
          </p>

          <div className="space-y-4">
            <RadioGroup
              value={editType}
              onValueChange={(value) => setEditType(value as "fixed" | "percentage")}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Establecer precio fijo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Ajustar por porcentaje
                </Label>
              </div>
            </RadioGroup>

            <div className="space-y-2">
              <Label htmlFor="value">{editType === "fixed" ? "Nuevo precio ($)" : "Porcentaje de cambio (%)"}</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  {editType === "fixed" ? (
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Percent className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <Input
                  id="value"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={editType === "fixed" ? "Ej: 1500" : "Ej: 10 (aumentar) o -10 (reducir)"}
                  className="pl-10"
                  step={editType === "fixed" ? "100" : "1"}
                />
              </div>
              {editType === "percentage" && (
                <p className="text-xs text-gray-500">
                  Use valores positivos para aumentar el precio y negativos para reducirlo.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !value || isNaN(Number(value))}
            className="bg-black hover:bg-gray-800 text-white"
          >
            {isSubmitting ? "Procesando..." : "Aplicar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

