"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PenLine, Trash2, Package2, Percent, DollarSign, AlertTriangle } from "lucide-react"
import { ProductModal } from "./product-modal"
import { DeleteConfirmation } from "../components/delete-confirmation"
import {
  getProducts,
  deleteProduct,
  updateMultipleProducts,
  deleteMultipleProducts,
  type Product,
} from "@/lib/products"
import { toast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { BulkEditModal } from "./bulk-edit-modal"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"

// Update the Category type to be more flexible
type Category = "Todos" | string

export function ProductsSection() {
  // Add this state at the beginning of the component
  const [availableCategories, setAvailableCategories] = useState<Category[]>([
    "Todos",
    "Plato principal",
    "canelones",
    "salsa",
    "carnes",
    "arrollados",
    "Entrada",
  ])
  const [initialProducts, setInitialProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<Category>("Todos")
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Estado para selección múltiple
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false)
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [selectAll, setSelectAll] = useState(false)

  // Usar el hook de suscripción en tiempo real para productos
  const { data: products } = useRealtimeSubscription<Product>("products", initialProducts, {
    onInsert: (newProduct) => {
      toast({
        title: "Nuevo producto",
        description: `Se ha agregado un nuevo producto: ${newProduct.name}`,
      })
    },
    onUpdate: (updatedProduct) => {
      toast({
        title: "Producto actualizado",
        description: `Se ha actualizado el producto: ${updatedProduct.name}`,
      })
    },
    onDelete: (deletedId) => {
      toast({
        title: "Producto eliminado",
        description: `Se ha eliminado un producto`,
      })
      // Asegurarse de que la UI se actualice inmediatamente
      setInitialProducts((prev) => prev.filter((product) => product.id !== deletedId))
    },
  })

  const categories: Category[] = ["Todos", "Plato principal", "canelones", "salsa", "carnes", "arrollados", "Entrada"]

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const data = await getProducts()
      setInitialProducts(data)
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsProductModalOpen(true)
  }

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteProduct = async () => {
    if (!selectedProduct) return

    setIsDeleting(true)
    try {
      const success = await deleteProduct(selectedProduct.id)
      if (success) {
        toast({
          title: "Producto eliminado",
          description: "El producto ha sido eliminado exitosamente.",
        })
        // No need to fetch products again, the real-time subscription will handle it
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el producto. Intente nuevamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  // Manejo de selección múltiple
  const toggleProductSelection = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map((product) => product.id))
    }
    setSelectAll(!selectAll)
  }

  const handleBulkEdit = async (priceChange: { type: "fixed" | "percentage"; value: number }) => {
    if (selectedProducts.length === 0) return

    try {
      const result = await updateMultipleProducts(selectedProducts, priceChange)

      if (result.success) {
        toast({
          title: "Precios actualizados",
          description: `Se actualizaron los precios de ${selectedProducts.length} productos.`,
        })
        // No need to fetch products again, the real-time subscription will handle it
        setSelectedProducts([])
        setSelectAll(false)
      } else {
        toast({
          title: "Error",
          description: result.message || "No se pudieron actualizar los precios.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating prices:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al actualizar los precios.",
        variant: "destructive",
      })
    }
  }

  // Eliminación masiva de productos
  const confirmBulkDelete = async () => {
    if (selectedProducts.length === 0) return

    setIsDeleting(true)
    try {
      const result = await deleteMultipleProducts(selectedProducts)

      if (result.success) {
        toast({
          title: "Productos eliminados",
          description: `Se eliminaron ${selectedProducts.length} productos exitosamente.`,
        })
        // No need to fetch products again, the real-time subscription will handle it
        setSelectedProducts([])
        setSelectAll(false)
      } else {
        toast({
          title: "Error",
          description: result.message || "No se pudieron eliminar los productos.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting products:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al eliminar los productos.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsBulkDeleteDialogOpen(false)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "Todos" || product.category === activeCategory
    return matchesSearch && matchesCategory
  })

  // Obtener nombres de productos seleccionados para mostrar en la confirmación
  const getSelectedProductNames = () => {
    const selectedNames = filteredProducts
      .filter((product) => selectedProducts.includes(product.id))
      .map((product) => product.name)

    if (selectedNames.length <= 3) {
      return selectedNames.join(", ")
    } else {
      return `${selectedNames.slice(0, 3).join(", ")} y ${selectedNames.length - 3} más`
    }
  }

  // In the handleTabChange function, update to handle custom categories
  const handleTabChange = (tab: string) => {
    setActiveCategory(tab as Category)
  }

  // Update the categories array to be dynamic based on products
  useEffect(() => {
    if (products.length > 0) {
      // Extract unique categories from products
      const uniqueCategories = Array.from(new Set(products.map((product) => product.category)))
      // Add "Todos" at the beginning
      setAvailableCategories(["Todos", ...uniqueCategories] as Category[])
    }
  }, [products])

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Package2 className="h-6 w-6" />
            <h1 className="text-2xl font-semibold">Productos</h1>
          </div>
          <p className="text-sm text-gray-500">Gestione el menú de su rotisería</p>
        </div>
        <div className="flex items-center gap-4">
          <Input
            type="search"
            placeholder="Buscar productos..."
            className="w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => {
              setSelectedProduct(null)
              setIsProductModalOpen(true)
            }}
          >
            + Nuevo Producto
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {availableCategories.map((category) => (
          <Button
            key={category}
            variant={activeCategory === category ? "default" : "outline"}
            className={`px-4 py-2 ${activeCategory === category ? "bg-black text-white" : ""}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h2 className="text-lg font-medium">Catálogo de Productos</h2>
            <span className="text-sm text-gray-500">{filteredProducts.length} productos en total</span>
          </div>

          {/* Botones de acciones masivas */}
          {selectedProducts.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{selectedProducts.length} productos seleccionados</span>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => setIsBulkEditModalOpen(true)}
              >
                <DollarSign className="h-4 w-4" />
                <Percent className="h-4 w-4" />
                Editar precios
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={() => setIsBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar seleccionados
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-8">Cargando productos...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border">
            {searchQuery || activeCategory !== "Todos"
              ? "No se encontraron productos con esos criterios."
              : "No hay productos registrados."}
          </div>
        ) : (
          <div className="bg-white rounded-lg border">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                      aria-label="Seleccionar todos los productos"
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Nombre</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Precio</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Formato</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Categoría</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Ingredientes</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 ${selectedProducts.includes(product.id) ? "bg-red-50" : ""}`}
                  >
                    <td className="px-4 py-4">
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id)}
                        aria-label={`Seleccionar ${product.name}`}
                      />
                    </td>
                    <td className="px-6 py-4">{product.name}</td>
                    <td className="px-6 py-4">${product.price}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="font-normal">
                        {product.format_sales || "Por porción"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="font-normal bg-gray-100 text-black">
                        {product.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {product.ingredients && product.ingredients.length > 0 ? (
                        <span className="text-sm text-gray-600">{product.ingredients.join(", ")}</span>
                      ) : (
                        <span className="text-gray-400">Sin ingredientes</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditProduct(product)}
                        >
                          <PenLine className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600"
                          onClick={() => handleDeleteProduct(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isProductModalOpen && (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          product={selectedProduct || undefined}
          onSuccess={fetchProducts}
        />
      )}

      {isDeleteDialogOpen && selectedProduct && (
        <DeleteConfirmation
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDeleteProduct}
          title="Eliminar Producto"
          description={`¿Está seguro que desea eliminar el producto "${selectedProduct.name}"? Esta acción no se puede deshacer.`}
          isDeleting={isDeleting}
        />
      )}

      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        onConfirm={handleBulkEdit}
        selectedCount={selectedProducts.length}
      />

      {/* Diálogo de confirmación para eliminación masiva */}
      <DeleteConfirmation
        isOpen={isBulkDeleteDialogOpen}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Eliminar Productos Seleccionados"
        description={
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">¡Atención! Esta acción no se puede deshacer.</span>
            </div>
            <p>
              Está a punto de eliminar <strong>{selectedProducts.length} productos</strong>:
            </p>
            <p className="text-gray-600 italic">{getSelectedProductNames()}</p>
            <p>¿Está seguro que desea continuar?</p>
          </div>
        }
        isDeleting={isDeleting}
        deleteButtonText="Eliminar Productos"
      />
    </div>
  )
}

