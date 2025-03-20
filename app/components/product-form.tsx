"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { dbService, type Category, type Product } from "@/lib/db-service"

interface ProductFormProps {
  onSubmit: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => Promise<void>
  initialData?: Product
  isEditing?: boolean
}

export default function ProductForm({ onSubmit, initialData, isEditing = false }: ProductFormProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [price, setPrice] = useState(initialData?.price?.toString() || "")
  const [category, setCategory] = useState(initialData?.category || "")
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Cargar categorías
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true)
      try {
        const data = await dbService.getCategories()
        setCategories(data)

        // Si no hay categoría seleccionada y hay categorías disponibles, seleccionar la primera
        if (!category && data.length > 0) {
          setCategory(data[0].id)
        }
      } catch (error) {
        console.error("Error loading categories:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las categorías",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadCategories()
  }, [category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "El nombre del producto es obligatorio",
        variant: "destructive",
      })
      return
    }

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      toast({
        title: "Error",
        description: "El precio debe ser un número positivo",
        variant: "destructive",
      })
      return
    }

    if (!category) {
      toast({
        title: "Error",
        description: "Debes seleccionar una categoría",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category,
    }

    try {
      await onSubmit(productData)

      toast({
        title: "Éxito",
        description: isEditing ? "Producto actualizado correctamente" : "Producto creado correctamente",
      })

      // Resetear el formulario si no estamos editando
      if (!isEditing) {
        setName("")
        setDescription("")
        setPrice("")
        // Mantener la categoría seleccionada para facilitar la creación de múltiples productos
      }
    } catch (error) {
      console.error("Error submitting product:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el producto",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddCategory = () => {
    router.push("/categories")
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Producto" : "Nuevo Producto"}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del producto"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del producto"
                rows={3}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="category">Categoría</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddCategory} disabled={isSubmitting}>
                  Gestionar Categorías
                </Button>
              </div>
              <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

