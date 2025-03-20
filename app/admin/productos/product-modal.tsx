"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createProduct, updateProduct, checkProductIdExists, saveCategory, getCategories } from "@/lib/products"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle } from "lucide-react"

const saleFormats = ["Por KG", "Por L", "Por porción", "Por docena"]
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
  const [categories, setCategories] = useState<string[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  // Cargar categorías al montar el componente
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true)
      try {
        const fetchedCategories = await getCategories()
        setCategories([...fetchedCategories, "Otra"])
      } catch (error) {
        console.error("Error fetching categories:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las categorías",
          variant: "destructive",
        })
        setCategories(["Plato principal", "Entrada", "Postre", "Bebida", "Otra"])
      } finally {
        setIsLoadingCategories(false)
      }
    }

    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  // Configurar el ID original y la categoría personalizada cuando cambia el producto
  useEffect(() => {
    if (product?.id) {
      setOriginalId(product.id)
    } else {
      setOriginalId(null)
    }

    if (product && categories.length > 0) {
      if (!categories.includes(product.category) && product.category !== "Otra") {
        setIsCustomCategory(true)
        setCustomCategory(product.category)
        setFormData((prev) => ({ ...prev, category: "Otra" }))
      } else {
        setIsCustomCategory(false)
        setCustomCategory("")
        setFormData((prev) => ({ ...prev, category: product.category }))
      }
    }
  }, [product, categories])

  // Estado del formulario
  const [formData, setFormData] = useState({
    id: product?.id ? String(product.id) : "",
    name: product?.name || "",
    price: product?.price ? String(product.price) : "",
    category: product?.category || "Plato principal",
    ingredientsText: product?.ingredients ? product.ingredients.join(", ") : "",
    format_sales: product?.format_sales || "Por porción",
  })

  // Resetear el formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        id: product?.id ? String(product.id) : "",
        name: product?.name || "",
        price: product?.price ? String(product.price) : "",
        category: product?.category || "Plato principal",
        ingredientsText: product?.ingredients ? product.ingredients.join(", ") : "",
        format_sales: product?.format_sales || "Por porción",
      })

      setIdError(null)
      setIsCheckingId(false)
    }
  }, [isOpen, product])

  // Manejar cambio de categoría
  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
    setIsCustomCategory(value === "Otra")
    if (value !== "Otra") {
      setCustomCategory("")
    }
  }

  // Verificar ID al cambiar
  const handleIdChange = async (value: string) => {
    setFormData((prev) => ({ ...prev, id: value }))
    setIdError(null)

    if (value && !isNaN(Number(value)) && Number(value) > 0) {
      // Solo verificamos si el ID es diferente al original
      if (!isEditing || (isEditing && originalId !== Number(value))) {
        setIsCheckingId(true)
        try {
          const idExists = await checkProductIdExists(value)
          if (idExists) {
            setIdError("Este ID ya está en uso. Por favor, elija otro.")
          }
        } catch (error) {
          console.error("Error checking ID:", error)
        } finally {
          setIsCheckingId(false)
        }
      }
    }
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar ID
    if (!formData.id || isNaN(Number(formData.id)) || Number(formData.id) <= 0) {
      setIdError("El ID debe ser un número positivo")
      return
    }

    // Validar nombre
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del producto es obligatorio",
        variant: "destructive",
      })
      return
    }

    // Validar precio
    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      toast({
        title: "Error",
        description: "El precio debe ser un número positivo",
        variant: "destructive",
      })
      return
    }

    // Verificar ID si es necesario
    if (!isEditing || (isEditing && originalId !== Number(formData.id))) {
      setIsCheckingId(true)
      try {
        const idExists = await checkProductIdExists(formData.id)
        if (idExists) {
          setIdError("Este ID ya está en uso. Por favor, elija otro.")
          setIsCheckingId(false)
          return
        }
      } catch (error) {
        console.error("Error checking ID:", error)
        setIsCheckingId(false)
        return
      }
      setIsCheckingId(false)
    }

    // Validar categoría personalizada
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
      // Guardar categoría personalizada si es necesario
      if (isCustomCategory && customCategory) {
        const categorySuccess = await saveCategory(customCategory)
        if (!categorySuccess) {
          throw new Error("No se pudo guardar la categoría")
        }

        // Actualizar la lista de categorías
        const updatedCategories = await getCategories()
        setCategories([...updatedCategories, "Otra"])
      }

      // Preparar datos del producto
      const productData = {
        id: Number(formData.id),
        name: formData.name.trim(),
        price: Number(formData.price),
        category: isCustomCategory ? customCategory : formData.category,
        ingredients: formData.ingredientsText
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== ""),
        format_sales: formData.format_sales,
      }

      // Crear o actualizar producto
      const success =
        isEditing && originalId !== null
          ? await updateProduct(originalId, productData)
          : await createProduct(productData)

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
        throw new Error("No se pudo guardar el producto")
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

  const isEditing = !!product

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* ID del producto */}
          <div className="space-y-2">
            <Label htmlFor="id">ID del producto</Label>
            <Input
              id="id"
              type="number"
              value={formData.id}
              onChange={(e) => handleIdChange(e.target.value)}
              placeholder="Ingrese un ID numérico"
              disabled={isSubmitting}
              required
            />
            {idError && (
              <div className="flex items-center text-red-500 text-sm mt-1">
                <AlertCircle className="h-4 w-4 mr-1" />
                {idError}
              </div>
            )}
            {isCheckingId && <div className="text-sm text-muted-foreground">Verificando disponibilidad del ID...</div>}
          </div>

          {/* Nombre del producto */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del producto</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ingrese el nombre del producto"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Precio */}
          <div className="space-y-2">
            <Label htmlFor="price">Precio</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
              placeholder="0.00"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            {isLoadingCategories ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">Cargando categorías...</span>
              </div>
            ) : (
              <Select
                value={formData.category}
                onValueChange={handleCategoryChange}
                disabled={isSubmitting || isLoadingCategories}
              >
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
            )}

            {isCustomCategory && (
              <div className="mt-2">
                <Input
                  id="customCategory"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Ingrese el nombre de la nueva categoría"
                  disabled={isSubmitting}
                  required
                />
              </div>
            )}
          </div>

          {/* Ingredientes */}
          <div className="space-y-2">
            <Label htmlFor="ingredients">Ingredientes (separados por comas)</Label>
            <Input
              id="ingredients"
              value={formData.ingredientsText}
              onChange={(e) => setFormData((prev) => ({ ...prev, ingredientsText: e.target.value }))}
              placeholder="Ingrediente 1, Ingrediente 2, ..."
              disabled={isSubmitting}
            />
          </div>

          {/* Formato de venta */}
          <div className="space-y-2">
            <Label>Formato de venta</Label>
            <RadioGroup
              value={formData.format_sales}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, format_sales: value }))}
              className="flex flex-wrap gap-4"
              disabled={isSubmitting}
            >
              {saleFormats.map((format) => (
                <div key={format} className="flex items-center space-x-2">
                  <RadioGroupItem value={format} id={format} />
                  <Label htmlFor={format} className="cursor-pointer">
                    {format}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting || isCheckingId}>
            {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

