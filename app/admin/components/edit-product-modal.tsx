"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import type { Product } from "@/types/order"

export interface OrderProductItem extends Product {
  quantity: number
  notes?: string
  removedIngredients?: string[]
}

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onSave: (product: OrderProductItem) => void
  existingData?: OrderProductItem // Add this prop
}

export function EditProductModal({ isOpen, onClose, product, onSave, existingData }: EditProductModalProps) {
  const [quantity, setQuantity] = useState(existingData?.quantity || 1)
  const [notes, setNotes] = useState(existingData?.notes || "")
  const [removedIngredients, setRemovedIngredients] = useState<string[]>(existingData?.removedIngredients || [])

  // Reset form when modal opens with new product
  useEffect(() => {
    if (isOpen) {
      setQuantity(existingData?.quantity || 1)
      setNotes(existingData?.notes || "")
      setRemovedIngredients(existingData?.removedIngredients || [])
    }
  }, [isOpen, existingData])

  if (!product) return null

  const handleIngredientToggle = (ingredient: string) => {
    if (removedIngredients.includes(ingredient)) {
      setRemovedIngredients(removedIngredients.filter((item) => item !== ingredient))
    } else {
      setRemovedIngredients([...removedIngredients, ingredient])
    }
  }

  const handleSave = () => {
    onSave({
      ...product,
      quantity,
      notes: notes.trim() || undefined,
      removedIngredients: removedIngredients.length > 0 ? removedIngredients : undefined,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{product.name}</h3>
            <span className="text-lg font-semibold">${product.price}</span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity">Cantidad</Label>
            <div className="flex items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </Button>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                className="h-8 w-16 mx-2 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
          </div>

          {product.ingredients && product.ingredients.length > 0 && (
            <div className="grid gap-2">
              <Label>Ingredientes</Label>
              <div className="border rounded-md p-3 space-y-2">
                {product.ingredients.map((ingredient) => (
                  <div key={ingredient} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ingredient-${ingredient}`}
                      checked={!removedIngredients.includes(ingredient)}
                      onCheckedChange={() => handleIngredientToggle(ingredient)}
                    />
                    <Label
                      htmlFor={`ingredient-${ingredient}`}
                      className={`font-normal ${removedIngredients.includes(ingredient) ? "line-through text-gray-400" : ""}`}
                    >
                      {ingredient}
                    </Label>
                  </div>
                ))}
              </div>
              {removedIngredients.length > 0 && (
                <p className="text-sm text-gray-500">{removedIngredients.length} ingrediente(s) serán quitados</p>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes">Notas especiales</Label>
            <Textarea
              id="notes"
              placeholder="Ej: Sin sal, más cocido, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            Agregar al pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

