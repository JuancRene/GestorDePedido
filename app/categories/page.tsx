"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/app/components/auth-provider"
import { useRouter } from "next/navigation"
import { dbService, type Category } from "@/lib/db-service"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  // Cargar categorías
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true)
      try {
        const data = await dbService.getCategories()
        setCategories(data)
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
  }, [])

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast({
        title: "Error",
        description: "La categoría no puede estar vacía",
        variant: "destructive",
      })
      return
    }

    if (categories.some((c) => c.name.toLowerCase() === newCategory.trim().toLowerCase())) {
      toast({
        title: "Error",
        description: "Esta categoría ya existe",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const addedCategory = await dbService.addCategory(newCategory.trim())

      if (addedCategory) {
        setCategories([...categories, addedCategory])
        setNewCategory("")
        toast({
          title: "Éxito",
          description: "Categoría agregada correctamente",
        })
      } else {
        throw new Error("No se pudo agregar la categoría")
      }
    } catch (error) {
      console.error("Error adding category:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar la categoría",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    setIsSubmitting(true)

    try {
      const success = await dbService.deleteCategory(id)

      if (success) {
        setCategories(categories.filter((c) => c.id !== id))
        toast({
          title: "Éxito",
          description: "Categoría eliminada correctamente",
        })
      } else {
        throw new Error("No se pudo eliminar la categoría")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Verificar si el usuario es administrador
  if (user?.role !== "admin") {
    router.push("/login")
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="Nueva categoría"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isSubmitting && handleAddCategory()}
              disabled={isSubmitting}
            />
            <Button onClick={handleAddCategory} disabled={isSubmitting || !newCategory.trim()}>
              {isSubmitting ? "Agregando..." : "Agregar"}
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium">Categorías existentes:</h3>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : categories.length === 0 ? (
              <p className="text-muted-foreground">No hay categorías definidas</p>
            ) : (
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li key={category.id} className="flex justify-between items-center p-2 border rounded">
                    <span>{category.name}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={isSubmitting}
                    >
                      Eliminar
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => router.push("/admin")}>
            Volver al Panel
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

