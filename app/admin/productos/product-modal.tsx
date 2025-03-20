"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createProduct, updateProduct, checkProductIdExists } from "@/lib/products"
import { toast } from "@/hooks/use-toast"
import { AlertCircle } from "lucide-react"

// Updated to include "Otra" option
const categories = ["Plato principal", "canelones", "salsa", "carnes", "arrollados", "Entrada", "Otra"]
const saleFormats = ["Por KG", "Por L", "Por porción", "Por docena", "Por bandeja"]
const bandejaOptions = ["chica", "mediana", "grande"]

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product?: {
    id: number
    name: string
    price: number
    category: string
    ingredients: string[]
    format_sales?: string
  }
  onSuccess: () => void
}

export function ProductModal({ isOpen, onClose, product, onSuccess }: ProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [idError, setIdError] = useState<string | null>(null)
  const [isCheckingId, setIsCheckingId] = useState(false)
  const [originalId, setOriginalId] = useState<number | null>(null)
  const [customCategory, setCustomCategory] = useState("")
  const [isCustomCategory, setIsCustomCategory] = useState(false)

  // Extraer formato de venta y tamaño de bandeja si existe
  const extractFormatInfo = (
    formatSales?: string,
  ): {
    baseFormat: string
    bandejaSize?: string
  } => {
    if (!formatSales) return { baseFormat: "Por porción" }

    if (formatSales.startsWith("Por bandeja")) {
      const sizeMatch = formatSales.match(/$$([^)]+)$$/)
      const bandejaSize = sizeMatch ? sizeMatch[1] : "mediana"
      return { baseFormat: "Por bandeja", bandejaSize }
    }

    return { baseFormat: formatSales }
  }

  const { baseFormat, bandejaSize: initialBandejaSize } = extractFormatInfo(product?.format_sales)

  const [formData, setFormData] = useState({
    id: product?.id ? String(product.id) : "",
    name: product?.name || "",
    price: product?.price ? String(product.price) : "",
    category: product?.category || "Plato principal",
    ingredientsText: product?.ingredients ? product.ingredients.join(", ") : "",
    format_sales: product?.format_sales || "Por porción",
  })

  // Guardar el ID original cuando se edita un producto
  useEffect(() => {
    if (product?.id) {
      setOriginalId(product.id)
    } else {
      setOriginalId(null)
    }

    // Check if the product has a custom category
    if (product && !categories.includes(product.category) && product.category !== "Otra") {
      setIsCustomCategory(true)
      setCustomCategory(product.category)
    } else {
      setIsCustomCategory(false)
      setCustomCategory("")
    }
  }, [product])

  const [selectedFormat, setSelectedFormat] = useState(baseFormat)
  const [bandejaSize, setBandejaSize] = useState(initialBandejaSize || "mediana")

  const isEditing = !!product

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Limpiar el error de ID cuando el usuario cambia el valor
    if (name === "id") {
      setIdError(null)
    }
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
    setIsCustomCategory(value === "Otra")
    if (value !== "Otra") {
      setCustomCategory("")
    }
  }

  const handleFormatChange = (value: string) => {
    setSelectedFormat(value)

    if (value === "Por bandeja") {
      setFormData((prev) => ({
        ...prev,
        format_sales: `Por bandeja (${bandejaSize})`,
      }))
    } else {
      setFormData((prev) => ({ ...prev, format_sales: value }))
    }
  }

  const handleBandejaSizeChange = (value: string) => {
    setBandejaSize(value)
    setFormData((prev) => ({
      ...prev,
      format_sales: `Por bandeja (${value})`,
    }))
  }

  // Verificar si el ID ya existe
  const checkIdExists = async (id: string) => {
    if (!id) return false

    // Si estamos editando y el ID no ha cambiado, no necesitamos verificar
    if (isEditing && originalId === Number(id)) return false

    setIsCheckingId(true)
    try {
      const exists = await checkProductIdExists(Number(id))
      setIsCheckingId(false)
      return exists
    } catch (error) {
      setIsCheckingId(false)
      console.error("Error checking ID:", error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que el ID sea un número
    if (!formData.id || isNaN(Number(formData.id))) {
      setIdError("El ID debe ser un número válido")
      return
    }

    // Verificar si el ID ya existe (solo si el ID ha cambiado)
    if (!isEditing || (isEditing && originalId !== Number(formData.id))) {
      const idExists = await checkIdExists(formData.id)
      if (idExists) {
        setIdError("Este ID ya está en uso. Por favor, elija otro.")
        return
      }
    }

    // Validate custom category if selected
    if (isCustomCategory && !customCategory.trim()) {
      toast({
        title: "Error",
        description: "Debe ingresar un nombre para la nueva categoría",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Construir el formato completo
      let formatString = selectedFormat
      if (selectedFormat === "Por bandeja") {
        formatString = `Por bandeja (${bandejaSize})`
      }

      // Convertir el texto de ingredientes a un array
      const ingredientsArray = formData.ingredientsText
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "")

      const productData = {
        id: Number(formData.id),
        name: formData.name,
        price: Number(formData.price),
        category: isCustomCategory ? customCategory : formData.category,
        ingredients: ingredientsArray,
        format_sales: formatString,
      }

      let success
      if (isEditing && originalId !== null) {
        // Pasar el ID original para actualizar el producto correcto
        success = await updateProduct(originalId, productData)
      } else {
        success = await createProduct(productData)
      }

      if (success) {
        toast({
          title: isEditing ? "Producto actualizado" : "Producto creado",
          description: isEditing
            ? "El producto ha sido actualizado exitosamente."
            : "El producto ha sido creado exitosamente.",
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: "Error",
          description: isEditing
            ? "No se pudo actualizar el producto. Intente nuevamente."
            : "No se pudo crear el producto. Intente nuevamente.",
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
          <DialogTitle>{isEditing ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="id">ID del Producto</Label>
              <Input
                id="id"
                name="id"
                type="number"
                value={formData.id}
                onChange={handleChange}
                required
                className={idError ? "border-red-500" : ""}
              />
              {idError && (
                <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{idError}</span>
                </div>
              )}
              {isEditing && (
                <p className="text-sm text-gray-500">
                  Puede cambiar el ID del producto, pero asegúrese de que no esté en uso por otro producto.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Precio</Label>
              <Input id="price" name="price" type="number" value={formData.price} onChange={handleChange} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Categoría</Label>
              <Select value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isCustomCategory && (
                <div className="grid gap-2 mt-2">
                  <Label htmlFor="customCategory">Nueva categoría</Label>
                  <Input
                    id="customCategory"
                    name="customCategory"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Ingrese el nombre de la nueva categoría"
                    required={isCustomCategory}
                  />
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Formato de venta</Label>
              <Select value={selectedFormat} onValueChange={handleFormatChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar formato de venta" />
                </SelectTrigger>
                <SelectContent>
                  {saleFormats.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedFormat === "Por bandeja" && (
                <div className="mt-2">
                  <Label htmlFor="bandejaSize" className="mb-2 block">
                    Tamaño de bandeja
                  </Label>
                  <RadioGroup value={bandejaSize} onValueChange={handleBandejaSizeChange} className="flex gap-4">
                    {bandejaOptions.map((size) => (
                      <div key={size} className="flex items-center gap-2">
                        <RadioGroupItem value={size} id={`bandeja-${size}`} />
                        <Label htmlFor={`bandeja-${size}`} className="font-normal capitalize">
                          {size}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ingredientsText">Ingredientes (separados por comas)</Label>
              <Input
                id="ingredientsText"
                name="ingredientsText"
                value={formData.ingredientsText}
                onChange={handleChange}
                placeholder="Ej: verduras, salsa blanca, salsa roja"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isCheckingId || !!idError}>
              {isSubmitting ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

