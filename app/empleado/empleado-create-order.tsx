"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { OrderProductItem } from "../admin/components/edit-product-modal"
import { getProducts } from "@/lib/products"
import type { Customer, Product } from "@/types/order"
import { toast } from "@/hooks/use-toast"
import { getUser } from "@/lib/auth"
import { createOrderWithOfflineSupport } from "@/lib/offline-orders"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TouchOrderScreen } from "./touch-order-screen"
import { logger } from "@/lib/logger"

const MODULE = "empleado-create-order"

export function EmpleadoCreateOrder() {
  // Inicializar la fecha con el formato correcto y asegurarse de que sea la fecha actual
  const today = new Date()
  // Ajustar la fecha para evitar problemas de zona horaria
  const adjustedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  // Formatear la fecha manualmente para evitar problemas de zona horaria
  const formattedDate = `${adjustedDate.getFullYear()}-${String(adjustedDate.getMonth() + 1).padStart(2, "0")}-${String(adjustedDate.getDate()).padStart(2, "0")}`

  logger.debug(MODULE, "Fecha inicial", {
    rawToday: today.toISOString(),
    adjustedDate: adjustedDate.toISOString(),
    formattedDate,
  })

  const [selectedClient, setSelectedClient] = useState<Customer | null>(null)
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false)
  const [newClientInitialName, setNewClientInitialName] = useState("")

  const [deliveryType, setDeliveryType] = useState<"retiro" | "envio">("retiro")
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "debito" | "credito" | "qr">("efectivo")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [cashAmount, setCashAmount] = useState("")
  const [pickupDate, setPickupDate] = useState(() => {
    // Crear la fecha usando el formato YYYY-MM-DD directamente para evitar problemas de zona horaria
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  })
  const [pickupTime, setPickupTime] = useState("")

  // Productos
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [orderItems, setOrderItems] = useState<OrderProductItem[]>([])
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      const data = await getProducts()
      setProducts(data)
    }
    loadProducts()
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
  }

  useEffect(() => {
    if (deliveryType === "envio" && selectedClient) {
      setDeliveryAddress(selectedClient.address)
    }
  }, [deliveryType, selectedClient])

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

  // Calcular total excluyendo productos vendidos por peso
  const orderTotal = orderItems.reduce((total, item) => {
    // Si el producto se vende por peso (Por KG), no lo sumamos al total
    if (item.format_sales === "Por KG") {
      return total
    }
    return total + item.price * item.quantity
  }, 0)

  // Añadir esta función después de las declaraciones de estado
  const handleDateChange = (date: string) => {
    // Asegurarse de que la fecha se mantenga en formato YYYY-MM-DD sin conversiones de zona horaria
    setPickupDate(date)
  }

  // Modificar la función handleSubmit para incluir el ID y nombre del empleado
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!selectedClient) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (orderItems.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un producto",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (!pickupDate) {
      toast({
        title: "Error",
        description: "Debe seleccionar una fecha de retiro/entrega",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (paymentMethod === "efectivo" && cashAmount) {
      const cashAmountNum = Number(cashAmount)
      if (cashAmountNum <= orderTotal) {
        toast({
          title: "Error",
          description: "El monto recibido debe ser mayor al total del pedido",
          variant: "destructive",
        })
        setIsSubmitting(false)
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
      cash_amount: paymentMethod === "efectivo" && cashAmount ? Number(cashAmount) : undefined,
      pickup_date: pickupDate,
      pickup_time: pickupTime,
      // Añadir información del empleado
      employee_id: user?.employeeId,
      employee_name: user?.name || user?.username,
    }

    try {
      // Use the offline-capable version instead
      const result = await createOrderWithOfflineSupport(orderData)

      if (result.success) {
        toast({
          title: result.isOffline ? "Pedido guardado localmente" : "Pedido creado",
          description: result.message,
          variant: result.isOffline ? "warning" : "default",
        })
        // Reset form
        setSelectedClient(null)
        setOrderItems([])
        setDeliveryType("retiro")
        setPaymentMethod("efectivo")
        setDeliveryAddress("")
        setCashAmount("")
        setPickupDate(new Date().toISOString().split("T")[0])
        setPickupTime("")
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al crear el pedido",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-6">
        <CardHeader className="bg-primary text-primary-foreground">
          <CardTitle className="text-2xl">Crear Nuevo Pedido</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TouchOrderScreen />
        </CardContent>
      </Card>
    </div>
  )
}

