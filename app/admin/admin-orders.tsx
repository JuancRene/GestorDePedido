"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClientSearch } from "./components/client-search"
import { CreateClientModal } from "./components/create-client-modal"
import { EditProductModal, type OrderProductItem } from "./components/edit-product-modal"
import { getProducts } from "@/lib/products"
import { Trash2, ShoppingCart, Calendar, Clock, CreditCard, MapPin, DollarSign, PenLine } from "lucide-react"
import type { Customer, Product } from "@/types/order"
import { getOrders, createOrder } from "@/lib/orders"
import type { Order } from "@/types/order"
import { toast } from "@/hooks/use-toast"
import { OrdersTable } from "./components/orders-table"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"
import { getUser } from "@/lib/auth"

export function AdminOrders() {
  const [activeTab, setActiveTab] = useState("todos")
  const [selectedClient, setSelectedClient] = useState<Customer | null>(null)
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false)
  const [newClientInitialName, setNewClientInitialName] = useState("")

  const [deliveryType, setDeliveryType] = useState<"retiro" | "envio">("retiro")
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "debito" | "credito" | "qr">("efectivo")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [cashAmount, setCashAmount] = useState("")
  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split("T")[0])
  const [pickupTime, setPickupTime] = useState("")

  // Productos
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [orderItems, setOrderItems] = useState<OrderProductItem[]>([])
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null)

  const [initialOrders, setInitialOrders] = useState<Order[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)

  // Usar el hook de suscripción en tiempo real para órdenes
  const { data: orders } = useRealtimeSubscription<Order>("orders", initialOrders, {
    onInsert: (newOrder) => {
      toast({
        title: "Nuevo pedido",
        description: `Se ha creado un nuevo pedido para ${newOrder.customer || "Cliente"}`,
      })
    },
    onUpdate: (updatedOrder) => {
      toast({
        title: "Pedido actualizado",
        description: `El pedido #${updatedOrder.id} ha sido actualizado`,
      })
    },
    onDelete: (deletedId) => {
      toast({
        title: "Pedido eliminado",
        description: `El pedido #${deletedId} ha sido eliminado`,
      })
    },
  })

  const fetchOrders = async (status?: "pending" | "completed") => {
    setIsLoadingOrders(true)
    try {
      // Determinar el estado a buscar basado en la pestaña activa o el parámetro proporcionado
      const statusToFetch =
        status || (activeTab === "pendientes" ? "pending" : activeTab === "completados" ? "completed" : undefined)

      console.log("Fetching orders with status:", statusToFetch)
      const data = await getOrders(statusToFetch)
      setInitialOrders(data)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los pedidos",
        variant: "destructive",
      })
    } finally {
      setIsLoadingOrders(false)
    }
  }

  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      const data = await getProducts()
      setProducts(data)
    }
    loadProducts()
    fetchOrders()
  }, [])

  const handleClientSelect = (client: Customer) => {
    setSelectedClient(client)
    if (deliveryType === "envio") {
      setDeliveryAddress(client.address)
    }
  }

  const handleCreateNewClient = (searchValue: string) => {
    setNewClientInitialName(searchValue)
    setIsCreateClientModalOpen(true)
  }

  const handleClientCreated = (client: Customer) => {
    setSelectedClient(client)
    setIsCreateClientModalOpen(false)
    if (deliveryType === "envio") {
      setDeliveryAddress(client.address)
    }
  }

  // Efecto para actualizar la dirección cuando cambia el tipo de entrega o el cliente
  useEffect(() => {
    if (deliveryType === "envio" && selectedClient) {
      setDeliveryAddress(selectedClient.address)
    } else if (deliveryType === "retiro") {
      setDeliveryAddress("")
    }
  }, [deliveryType, selectedClient])

  // Función para manejar el cambio de tipo de entrega
  const handleDeliveryTypeChange = (value: "retiro" | "envio") => {
    setDeliveryType(value)
    if (value === "envio" && selectedClient) {
      setDeliveryAddress(selectedClient.address)
    } else if (value === "retiro") {
      setDeliveryAddress("")
    }
  }

  // Manejo de productos
  const handleProductSelect = (productId: string) => {
    const product = products.find((p) => p.id.toString() === productId)
    if (product) {
      setSelectedProduct(product)
      setIsEditProductModalOpen(true)
    }
    setSelectedProductId("")
  }

  const handleEditProduct = (index: number) => {
    const productToEdit = orderItems[index]
    setSelectedProduct({
      id: Number.parseInt(productToEdit.id),
      name: productToEdit.name,
      price: productToEdit.price,
      category: productToEdit.category,
      ingredients: productToEdit.ingredients || [],
      format_sales: productToEdit.format_sales || "Por porción",
    })
    // Store the index of the product being edited
    setEditingProductIndex(index)
    setIsEditProductModalOpen(true)
  }

  const handleAddProduct = (product: OrderProductItem) => {
    if (editingProductIndex !== null) {
      // Update existing product
      const updatedItems = [...orderItems]
      updatedItems[editingProductIndex] = product
      setOrderItems(updatedItems)
      setEditingProductIndex(null)
    } else {
      // Add new product
      setOrderItems([...orderItems, product])
    }
  }

  const handleRemoveProduct = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === "pendientes") {
      fetchOrders("pending")
    } else if (tab === "completados") {
      fetchOrders("completed")
    } else {
      fetchOrders() // "todos"
    }
  }

  // Calcular total excluyendo productos vendidos por peso
  const orderTotal = orderItems.reduce((total, item) => {
    // Si el producto se vende por peso (Por KG), no lo sumamos al total
    if (item.format_sales === "Por KG") {
      return total
    }
    return total + item.price * item.quantity
  }, 0)

  // Modificar la función handleSubmit para incluir el ID y nombre del empleado
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClient) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente",
        variant: "destructive",
      })
      return
    }

    if (orderItems.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un producto",
        variant: "destructive",
      })
      return
    }

    if (!pickupDate) {
      toast({
        title: "Error",
        description: "Debe seleccionar una fecha de retiro/entrega",
        variant: "destructive",
      })
      return
    }

    if (paymentMethod === "efectivo") {
      const cashAmountNum = Number(cashAmount)
      if (cashAmountNum <= orderTotal) {
        toast({
          title: "Error",
          description: "El monto recibido debe ser mayor al total del pedido",
          variant: "destructive",
        })
        return
      }
    }

    // Obtener el usuario actual
    const user = await getUser()

    const orderData = {
      customer_id: selectedClient.id,
      customer_name: selectedClient.name, // Añadir el nombre del cliente
      items: orderItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        removedIngredients: item.removedIngredients || [],
        notes: item.notes || "",
        category: item.category,
        ingredients: item.ingredients || [],
        format_sales: item.format_sales || "Por porción",
      })),
      total: orderTotal,
      delivery_method: deliveryType,
      delivery_address: deliveryType === "envio" ? deliveryAddress : undefined,
      payment_method: paymentMethod,
      cash_amount: paymentMethod === "efectivo" ? Number(cashAmount) : undefined,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      // Añadir información del empleado
      employee_id: user?.employeeId,
      employee_name: user?.name || user?.username,
    }

    const result = await createOrder(orderData)

    if (result.success) {
      toast({
        title: "Pedido creado",
        description: result.message,
      })
      // Reset form
      setSelectedClient(null)
      setOrderItems([])
      setDeliveryType("retiro")
      setPaymentMethod("efectivo")
      setDeliveryAddress("")
      setCashAmount("")
      // No need to refresh orders manually, the real-time subscription will handle it
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* Nuevo Pedido Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingCart className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-medium">Nuevo Pedido</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">Complete el formulario para crear un nuevo pedido</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cliente */}
          <div>
            <Label className="text-base mb-2 block">Cliente</Label>
            <ClientSearch onSelect={handleClientSelect} onCreateNew={handleCreateNewClient} />
          </div>

          {/* Agregar Productos */}
          <div>
            <Label className="text-base mb-2 block">Agregar Productos</Label>
            <Select value={selectedProductId} onValueChange={handleProductSelect}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Seleccionar producto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id.toString()}>
                    {product.name} - ${product.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Productos seleccionados */}
          {orderItems.length > 0 && (
            <div>
              <h3 className="text-base font-medium mb-3">Productos seleccionados:</h3>
              <div className="space-y-3">
                {orderItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.name}</span>
                        {item.format_sales === "Por KG" ? (
                          <span className="text-lg">${item.price}/kg</span>
                        ) : (
                          <span className="text-lg">${item.price * item.quantity}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>Cantidad: {item.quantity}</span>
                        {item.format_sales === "Por KG" && (
                          <span className="ml-2 text-red-600 font-medium">• Precio por peso (no suma al total)</span>
                        )}
                        {item.removedIngredients && item.removedIngredients.length > 0 && (
                          <span className="ml-2">• Sin: {item.removedIngredients.join(", ")}</span>
                        )}
                        {item.notes && <div>Nota: {item.notes}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-black hover:text-gray-800 hover:bg-gray-100"
                        onClick={() => handleEditProduct(index)}
                      >
                        <PenLine className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-500 hover:bg-red-50"
                        onClick={() => handleRemoveProduct(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between font-medium text-xl pt-3 border-t">
                  <span>Total:</span>
                  <span>${orderTotal}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tipo de Entrega */}
          <div>
            <Label className="text-base mb-2 block">Tipo de Entrega</Label>
            <RadioGroup
              value={deliveryType}
              className="flex gap-6"
              onValueChange={(value) => handleDeliveryTypeChange(value as "retiro" | "envio")}
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="retiro" id="retiro" />
                <Label htmlFor="retiro" className="font-normal">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    Retiro en local
                  </span>
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="envio" id="envio" />
                <Label htmlFor="envio" className="font-normal">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Envío a domicilio
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Dirección de entrega (si es envío) */}
          {deliveryType === "envio" && (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Dirección de entrega
                </Label>
                <Input
                  type="text"
                  className="w-full bg-white"
                  placeholder="Ingrese la dirección de entrega"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>

              {/* Método de pago */}
              <div>
                <Label className="mb-2 block">Método de pago</Label>
                <RadioGroup
                  value={paymentMethod}
                  className="flex flex-wrap gap-4"
                  onValueChange={(value) => setPaymentMethod(value as "efectivo" | "debito" | "credito" | "qr")}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="efectivo" id="efectivo" />
                    <Label htmlFor="efectivo" className="font-normal">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Efectivo
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="debito" id="debito" />
                    <Label htmlFor="debito" className="font-normal">
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-4 h-4" />
                        Débito
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="credito" id="credito" />
                    <Label htmlFor="credito" className="font-normal">
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-4 h-4" />
                        Crédito
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="qr" id="qr" />
                    <Label htmlFor="qr" className="font-normal">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                          />
                        </svg>
                        QR
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Vuelto (si es efectivo) */}
              {paymentMethod === "efectivo" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      Vuelto de:
                    </Label>
                    <Input
                      type="number"
                      className="w-full bg-white"
                      placeholder="Ingrese el monto recibido"
                      value={cashAmount}
                      onChange={(e) => {
                        const amount = Number(e.target.value)
                        if (amount < orderTotal) {
                          toast({
                            title: "Error",
                            description: "El monto recibido debe ser mayor al total del pedido",
                            variant: "destructive",
                          })
                        }
                        setCashAmount(e.target.value)
                      }}
                    />
                  </div>
                  {Number(cashAmount) > 0 && (
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monto recibido:</span>
                        <span className="font-medium">${cashAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total del pedido:</span>
                        <span className="font-medium">-${orderTotal}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t">
                        <span className="font-medium">Vuelto:</span>
                        <span
                          className={`font-medium ${Number(cashAmount) < orderTotal ? "text-red-600" : "text-black"}`}
                        >
                          ${(Number(cashAmount) - orderTotal).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Fecha y hora de retiro */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Fecha de retiro
            </Label>
            <Input
              type="date"
              className="w-full bg-white"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Hora de retiro (opcional)
            </Label>
            <Input
              type="time"
              className="w-full bg-white"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
            />
          </div>

          {/* Botón de crear pedido */}
          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-md">
            Crear Pedido
          </Button>
        </form>
      </div>

      {/* Pedidos Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h2 className="text-lg font-medium">Pedidos</h2>
            <span className="text-sm text-gray-500">Gestione todos los pedidos de la rotisería</span>
          </div>
          <div className="flex items-center gap-2">
            <Input type="search" placeholder="Buscar pedidos..." className="w-64 bg-white" />
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={activeTab === "todos" ? "default" : "ghost"}
                onClick={() => handleTabChange("todos")}
                size="sm"
                className="rounded"
              >
                Todos
              </Button>
              <Button
                variant={activeTab === "pendientes" ? "default" : "ghost"}
                onClick={() => handleTabChange("pendientes")}
                size="sm"
                className="rounded"
              >
                Pendientes
              </Button>
              <Button
                variant={activeTab === "completados" ? "default" : "ghost"}
                onClick={() => handleTabChange("completados")}
                size="sm"
                className="rounded"
              >
                Completados
              </Button>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {isLoadingOrders ? (
          <div className="text-center py-8 bg-white rounded-lg border">Cargando pedidos...</div>
        ) : (
          <OrdersTable orders={orders} onOrderUpdate={fetchOrders} />
        )}
      </div>

      <CreateClientModal
        isOpen={isCreateClientModalOpen}
        onClose={() => setIsCreateClientModalOpen(false)}
        initialName={newClientInitialName}
        onSuccess={handleClientCreated}
      />

      <EditProductModal
        isOpen={isEditProductModalOpen}
        onClose={() => {
          setIsEditProductModalOpen(false)
          setEditingProductIndex(null)
        }}
        product={selectedProduct}
        onSave={handleAddProduct}
        existingData={editingProductIndex !== null ? orderItems[editingProductIndex] : undefined}
      />
    </div>
  )
}

