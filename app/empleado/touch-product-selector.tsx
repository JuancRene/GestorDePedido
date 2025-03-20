"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { TouchNumpad } from "@/app/components/touch-numpad"
import { TouchKeyboard } from "@/app/components/touch-keyboard"
import type { Product } from "@/types/order"
import type { OrderProductItem } from "@/app/admin/components/edit-product-modal"

interface TouchProductSelectorProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  onProductSelect: (product: OrderProductItem) => void
}

export function TouchProductSelector({ isOpen, onClose, products, onProductSelect }: TouchProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState("1")
  const [notes, setNotes] = useState("")
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([])
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [showNumpad, setShowNumpad] = useState(false)

  // Get unique categories
  const categories = ["all", ...new Set(products.map((p) => p.category))].filter(Boolean)

  // Filter products by category and search term
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedProduct(null)
      setQuantity("1")
      setNotes("")
      setRemovedIngredients([])
      setSearchTerm("")
      setSelectedCategory("all")
      setShowKeyboard(false)
      setShowNumpad(false)
    }
  }, [isOpen])

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setShowNumpad(true)
  }

  const handleQuantityConfirm = () => {
    setShowNumpad(false)
  }

  const handleIngredientToggle = (ingredient: string) => {
    if (removedIngredients.includes(ingredient)) {
      setRemovedIngredients(removedIngredients.filter((i) => i !== ingredient))
    } else {
      setRemovedIngredients([...removedIngredients, ingredient])
    }
  }

  const handleAddProduct = () => {
    if (!selectedProduct) return

    const productItem: OrderProductItem = {
      id: selectedProduct.id.toString(),
      name: selectedProduct.name,
      price: selectedProduct.price,
      quantity: Number.parseInt(quantity),
      notes: notes,
      removedIngredients: removedIngredients,
      category: selectedProduct.category,
      ingredients: selectedProduct.ingredients,
      format_sales: selectedProduct.format_sales,
    }

    onProductSelect(productItem)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] max-h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl">Seleccionar Producto</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar productos..."
                className="pl-10 h-12 text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowKeyboard(true)}
              />
            </div>
          </div>
        </DialogHeader>

        {showKeyboard && (
          <div className="absolute inset-x-0 bottom-0 z-50 border-t bg-white p-2">
            <TouchKeyboard
              value={searchTerm}
              onChange={setSearchTerm}
              onClose={() => setShowKeyboard(false)}
              placeholder="Buscar productos..."
            />
          </div>
        )}

        {showNumpad && selectedProduct && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-medium mb-4">{selectedProduct.name}</h3>

              <TouchNumpad value={quantity} onChange={setQuantity} title="Cantidad" maxValue={99} />

              {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium mb-2">Ingredientes</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProduct.ingredients.map((ingredient) => (
                      <Button
                        key={ingredient}
                        variant={removedIngredients.includes(ingredient) ? "destructive" : "outline"}
                        className="justify-start h-12 text-base"
                        onClick={() => handleIngredientToggle(ingredient)}
                      >
                        {removedIngredients.includes(ingredient) ? `Sin ${ingredient}` : ingredient}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h4 className="text-lg font-medium mb-2">Notas</h4>
                <Input
                  placeholder="Notas adicionales..."
                  className="h-12 text-lg"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 mt-6">
                <Button variant="outline" className="flex-1 h-12 text-lg" onClick={() => setShowNumpad(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1 h-12 text-lg" onClick={handleAddProduct}>
                  Agregar
                </Button>
              </div>
            </div>
          </div>
        )}

        <Tabs
          defaultValue="all"
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          className="flex-1 flex flex-col"
        >
          <div className="border-b p-2">
            <ScrollArea className="w-full" orientation="horizontal">
              <TabsList className="h-14">
                <TabsTrigger
                  value="all"
                  className="h-12 px-6 text-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Todos
                </TabsTrigger>
                {categories
                  .filter((c) => c !== "all")
                  .map((category) => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      className="h-12 px-6 text-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {category}
                    </TabsTrigger>
                  ))}
              </TabsList>
            </ScrollArea>
          </div>

          <TabsContent value={selectedCategory} className="flex-1 p-4 m-0">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    className="h-24 flex flex-col items-start justify-start p-4 text-left"
                    onClick={() => handleProductClick(product)}
                  >
                    <span className="text-lg font-medium">{product.name}</span>
                    <span className="text-base text-gray-600">${product.price}</span>
                    {product.format_sales === "Por KG" && <span className="text-sm text-amber-600">Por peso</span>}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

