"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ShoppingCart,
  Trash2,
  PenLine,
  Plus,
  User,
  MapPin,
  CreditCard,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
} from "lucide-react"
import { TouchProductSelector } from "./touch-product-selector"
import { TouchNumpad } from "@/app/components/touch-numpad"
import { TouchKeyboard } from "@/app/components/touch-keyboard"
import { getProducts } from "@/lib/products"
import { getUser } from "@/lib/auth"
import { createOrderWithOfflineSupport } from "@/lib/offline-orders"
import { toast } from "@/hooks/use-toast"
import type { Customer, Product } from "@/types/order"
import type { OrderProductItem } from "@/app/admin/components/edit-product-modal"
import { ClientSearch } from "../admin/components/client-search"
import { CreateClientModal } from "../admin/components/create-client-modal"
import { TouchDatePicker } from "@/app/components/touch-date-picker"
import { TouchTimeInput } from "@/app/components/touch-time-input"
import { logger } from "@/lib/logger"
import { useSyncEvents } from "@/lib/realtime-sync"

const MODULE = "touch-order-screen"

export function TouchOrderScreen() {
  // Estado para productos y clientes
  const [products, setProducts] = useState<Product[]>([])
  const [selectedClient, setSelectedClient] = useState<Customer | null>(null)
  const [orderItems, setOrderItems] = useState<OrderProductItem[]>([])

  // Estado para modales
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false)
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false)
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false)
  const [newClientInitialName, setNewClientInitialName] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Estado para opciones de pedido
  const [deliveryType, setDeliveryType] = useState<"retiro" | "envio">("retiro")
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "debito" | "credito" | "qr">("efectivo")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [cashAmount, setCashAmount] = useState("")

  // Inicializar la fecha con el formato correcto
  const [pickupDate, setPickupDate] = useState(() => {
    // Obtener la fecha actual
    const now = new Date()
    // Formatear la fecha manualmente para evitar problemas de zona horaria
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  })

  const [pickupTime, setPickupTime] = useState("")

  // Estado para teclados táctiles
  const [showAddressKeyboard, setShowAddressKeyboard] = useState(false)
  const [showCashNumpad, setShowCashNumpad] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  // Estado para envío de formulario
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Suscribirse a eventos de sincronización relacionados con fechas
  useSyncEvents(["DATE_FORMAT_UPDATE"])

  // Registrar la fecha inicial para depuración
  useEffect(() => {
    logger.debug(MODULE, "Fecha inicial", {
      pickupDate,
      formattedForDisplay: pickupDate ? formatDateForDisplay(pickupDate) : "No date",
    })
  }, [])

  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      try {
        logger.debug(MODULE, "Cargando productos")
        const data = await getProducts()
        logger.debug(MODULE, `Productos cargados: ${data.length}`)
        setProducts(data)
      } catch (error) {
        logger.error(MODULE, "Error al cargar productos", { error })
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive",
        })
      }
    }
    loadProducts()
  }, [])

  // Calcular total excluyendo productos vendidos por peso
  const orderTotal = orderItems.reduce((total, item) => {
    if (item.format_sales === "Por KG") {
      return total
    }
    return total + item.price * item.quantity
  }, 0)

  const handleClientSelect = (client: Customer) => {
    logger.debug(MODULE, "Cliente seleccionado", { clientId: client.id, clientName: client.name })
    setSelectedClient(client)
    setIsClientSelectorOpen(false)
    // Autocompletar la dirección si el tipo de entrega es envío
    if (deliveryType === "envio") {
      setDeliveryAddress(client.address)
    }
  }

  const handleCreateNewClient = (searchValue: string) => {
    logger.debug(MODULE, "Iniciando creación de nuevo cliente", { initialName: searchValue })
    setNewClientInitialName(searchValue)
    setIsCreateClientModalOpen(true)
  }

  const handleClientCreated = (client: Customer) => {
    logger.debug(MODULE, "Cliente creado", { clientId: client.id, clientName: client.name })
    setSelectedClient(client)
    setIsCreateClientModalOpen(false)
    setIsClientSelectorOpen(false)
    // Autocompletar la dirección si el tipo de entrega es envío
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

  // Efecto para manejar el cambio de tipo de entrega
  const handleDeliveryTypeChange = (type: "retiro" | "envio") => {
    setDeliveryType(type)
    if (type === "envio" && selectedClient) {
      setDeliveryAddress(selectedClient.address)
    } else if (type === "retiro") {
      setDeliveryAddress("")
    }
  }

  const handleAddProduct = (product: OrderProductItem) => {
    logger.debug(MODULE, "Producto añadido", { productId: product.id, productName: product.name })
    setOrderItems([...orderItems, product])
  }

  const handleRemoveProduct = (index: number) => {
    logger.debug(MODULE, "Producto eliminado", { index, productName: orderItems[index]?.name })
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  // Función para manejar el cambio de fecha
  const handleDateChange = (date: string) => {
    logger.debug(MODULE, "Fecha seleccionada", { date })
    setPickupDate(date)
  }

  // Función para formatear la fecha para mostrar
  const formatDateForDisplay = (dateString: string): string => {
    try {
      // Formatear manualmente para evitar problemas de zona horaria
      const parts = dateString.split("-")
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
      return dateString
    } catch (error) {
      logger.error(MODULE, "Error al formatear fecha para mostrar", { dateString, error })
      return dateString
    }
  }

  const handleSubmit = async () => {
    logger.info(MODULE, "Iniciando creación de pedido")
    setIsSubmitting(true)

    if (!selectedClient) {
      logger.warn(MODULE, "Intento de crear pedido sin cliente seleccionado")
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (orderItems.length === 0) {
      logger.warn(MODULE, "Intento de crear pedido sin productos")
      toast({
        title: "Error",
        description: "Debe agregar al menos un producto",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    if (!pickupDate) {
      logger.warn(MODULE, "Intento de crear pedido sin fecha de retiro/entrega")
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
        logger.warn(MODULE, "Monto de efectivo insuficiente", { cashAmount: cashAmountNum, orderTotal })
        toast({
          title: "Error",
          description: "El monto recibido debe ser mayor al total del pedido",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }
    }

    try {
      // Obtener el usuario actual
      logger.debug(MODULE, "Obteniendo información del usuario")
      const user = await getUser()
      logger.debug(MODULE, "Usuario obtenido", {
        employeeId: user?.employeeId,
        username: user?.username,
      })

      const orderData = {
        customer_id: selectedClient.id,
        customer_name: selectedClient.name, // Añadimos el nombre del cliente
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

      logger.debug(MODULE, "Enviando datos de orden", {
        customerId: orderData.customer_id,
        customerName: orderData.customer_name,
        itemsCount: orderData.items.length,
        total: orderData.total,
        pickupDate: orderData.pickup_date, // Añadido para depuración
      })

      // Use the offline-capable version
      const result = await createOrderWithOfflineSupport(orderData)

      if (result.success) {
        logger.info(MODULE, "Pedido creado exitosamente", {
          orderId: result.orderId,
          isOffline: result.isOffline,
        })

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

        // Reiniciar la fecha con el formato correcto
        const resetToday = new Date()
        setPickupDate(
          `${resetToday.getFullYear()}-${String(resetToday.getMonth() + 1).padStart(2, "0")}-${String(resetToday.getDate()).padStart(2, "0")}`,
        )

        setPickupTime("")
      } else {
        logger.error(MODULE, "Error al crear pedido", { error: result.error })
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      logger.error(MODULE, "Error inesperado al crear pedido", { error })
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
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {/* Panel izquierdo - Productos */}
        <div className="md:col-span-2 flex flex-col h-full">
          <div className="bg-white rounded-lg shadow p-4 mb-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Nuevo Pedido</h2>
            <div className="flex gap-2">
              <Button className="h-14 px-6 text-lg" onClick={() => setIsClientSelectorOpen(true)}>
                <User className="mr-2 h-5 w-5" />
                {selectedClient ? selectedClient.name : "Seleccionar Cliente"}
              </Button>
              <Button className="h-14 px-6 text-lg" onClick={() => setIsProductSelectorOpen(true)}>
                <Plus className="mr-2 h-5 w-5" />
                Agregar Producto
              </Button>
            </div>
          </div>

          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-0 h-full flex flex-col">
              <div className="p-4 border-b">
                <h3 className="text-lg font-medium">Productos seleccionados</h3>
              </div>

              {orderItems.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                  <div>
                    <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg text-gray-500">No hay productos seleccionados</p>
                    <p className="text-gray-400">Haga clic en "Agregar Producto" para comenzar</p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-3">
                    {orderItems.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-4 rounded-md border border-gray-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-medium">{item.name}</span>
                            {item.format_sales === "Por KG" ? (
                              <span className="text-xl">${item.price}/kg</span>
                            ) : (
                              <span className="text-xl">${item.price * item.quantity}</span>
                            )}
                          </div>
                          <div className="text-base text-gray-600">
                            <span>Cantidad: {item.quantity}</span>
                            {item.format_sales === "Por KG" && (
                              <span className="ml-2 text-red-600 font-medium">
                                • Precio por peso (no suma al total)
                              </span>
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
                            size="lg"
                            className="h-12 w-12 p-0 text-black hover:text-gray-800 hover:bg-gray-100"
                            onClick={() => {
                              /* Implementar edición */
                            }}
                          >
                            <PenLine className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="lg"
                            className="h-12 w-12 p-0 text-red-400 hover:text-red-500 hover:bg-red-50"
                            onClick={() => handleRemoveProduct(index)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <div className="p-4 border-t bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-medium">Total:</span>
                  <span className="text-2xl font-bold">${orderTotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel derecho - Opciones de pedido */}
        <div className="md:col-span-1 flex flex-col h-full">
          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-0 h-full flex flex-col">
              <div className="p-4 border-b">
                <h3 className="text-lg font-medium">Detalles del pedido</h3>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                  {/* Tipo de entrega */}
                  <div>
                    <h4 className="text-base font-medium mb-3">Tipo de Entrega</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={deliveryType === "retiro" ? "default" : "outline"}
                        className="h-16 text-lg justify-start px-4"
                        onClick={() => handleDeliveryTypeChange("retiro")}
                      >
                        <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                        Retiro en local
                      </Button>
                      <Button
                        variant={deliveryType === "envio" ? "default" : "outline"}
                        className="h-16 text-lg justify-start px-4"
                        onClick={() => handleDeliveryTypeChange("envio")}
                      >
                        <MapPin className="w-6 h-6 mr-2" />
                        Envío a domicilio
                      </Button>
                    </div>
                  </div>

                  {/* Dirección (si es envío) */}
                  {deliveryType === "envio" && (
                    <div>
                      <h4 className="text-base font-medium mb-3">Dirección de entrega</h4>
                      <Button
                        variant="outline"
                        className="w-full h-16 text-lg justify-start px-4"
                        onClick={() => setShowAddressKeyboard(true)}
                      >
                        <MapPin className="w-6 h-6 mr-2" />
                        {deliveryAddress || "Ingresar dirección"}
                      </Button>
                    </div>
                  )}

                  {/* Método de pago */}
                  <div>
                    <h4 className="text-base font-medium mb-3">Método de pago</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={paymentMethod === "efectivo" ? "default" : "outline"}
                        className="h-16 text-lg justify-start px-4"
                        onClick={() => setPaymentMethod("efectivo")}
                      >
                        <DollarSign className="w-6 h-6 mr-2" />
                        Efectivo
                      </Button>
                      <Button
                        variant={paymentMethod === "debito" ? "default" : "outline"}
                        className="h-16 text-lg justify-start px-4"
                        onClick={() => setPaymentMethod("debito")}
                      >
                        <CreditCard className="w-6 h-6 mr-2" />
                        Débito
                      </Button>
                      <Button
                        variant={paymentMethod === "credito" ? "default" : "outline"}
                        className="h-16 text-lg justify-start px-4"
                        onClick={() => setPaymentMethod("credito")}
                      >
                        <CreditCard className="w-6 h-6 mr-2" />
                        Crédito
                      </Button>
                      <Button
                        variant={paymentMethod === "qr" ? "default" : "outline"}
                        className="h-16 text-lg justify-start px-4"
                        onClick={() => setPaymentMethod("qr")}
                      >
                        <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                          />
                        </svg>
                        QR
                      </Button>
                    </div>
                  </div>

                  {/* Vuelto (si es efectivo) */}
                  {paymentMethod === "efectivo" && (
                    <div>
                      <h4 className="text-base font-medium mb-3">Vuelto de:</h4>
                      <Button
                        variant="outline"
                        className="w-full h-16 text-lg justify-between px-4"
                        onClick={() => setShowCashNumpad(true)}
                      >
                        <span className="flex items-center">
                          <DollarSign className="w-6 h-6 mr-2" />
                          {cashAmount ? `$${cashAmount}` : "Ingresar monto"}
                        </span>
                        {Number(cashAmount) > 0 && (
                          <span className="text-green-600 font-medium">
                            Vuelto: ${(Number(cashAmount) - orderTotal).toFixed(2)}
                          </span>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Fecha y hora */}
                  <div>
                    <h4 className="text-base font-medium mb-3">Fecha y hora de retiro/entrega</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="h-16 text-lg justify-start px-4"
                        onClick={() => setShowDatePicker(true)}
                      >
                        <Calendar className="w-6 h-6 mr-2" />
                        {pickupDate ? formatDateForDisplay(pickupDate) : "Seleccionar fecha"}
                      </Button>
                      <Button
                        variant="outline"
                        className="h-16 text-lg justify-start px-4"
                        onClick={() => setShowTimePicker(true)}
                      >
                        <Clock className="w-6 h-6 mr-2" />
                        {pickupTime || "Ingresar hora"}
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              <div className="p-4 border-t">
                <Button
                  className="w-full h-16 text-xl"
                  disabled={isSubmitting || !selectedClient || orderItems.length === 0}
                  onClick={handleSubmit}
                >
                  <CheckCircle className="w-6 h-6 mr-2" />
                  {isSubmitting ? "Procesando..." : "Confirmar Pedido"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modales */}
      <TouchProductSelector
        isOpen={isProductSelectorOpen}
        onClose={() => setIsProductSelectorOpen(false)}
        products={products}
        onProductSelect={handleAddProduct}
      />

      <Dialog open={isClientSelectorOpen} onOpenChange={setIsClientSelectorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Seleccionar Cliente</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <ClientSearch onSelect={handleClientSelect} onCreateNew={handleCreateNewClient} className="h-12 text-lg" />
          </div>
        </DialogContent>
      </Dialog>

      <CreateClientModal
        isOpen={isCreateClientModalOpen}
        onClose={() => setIsCreateClientModalOpen(false)}
        initialName={newClientInitialName}
        onSuccess={handleClientCreated}
      />

      <Dialog open={showAddressKeyboard} onOpenChange={setShowAddressKeyboard}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dirección de entrega</DialogTitle>
          </DialogHeader>
          <TouchKeyboard
            value={deliveryAddress}
            onChange={setDeliveryAddress}
            onSubmit={() => setShowAddressKeyboard(false)}
            placeholder="Ingrese la dirección de entrega"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showCashNumpad} onOpenChange={setShowCashNumpad}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Monto recibido</DialogTitle>
          </DialogHeader>
          <TouchNumpad
            value={cashAmount}
            onChange={setCashAmount}
            allowDecimal={true}
            title="Ingrese el monto recibido"
          />
          {Number(cashAmount) > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Monto recibido:</span>
                <span className="font-medium">${cashAmount}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Total del pedido:</span>
                <span className="font-medium">-${orderTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-medium">Vuelto:</span>
                <span className={`font-medium ${Number(cashAmount) < orderTotal ? "text-red-600" : "text-green-600"}`}>
                  ${(Number(cashAmount) - orderTotal).toFixed(2)}
                </span>
              </div>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowCashNumpad(false)}>Aceptar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <TouchDatePicker
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={pickupDate}
        onChange={handleDateChange}
      />

      <TouchTimeInput
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        value={pickupTime}
        onChange={setPickupTime}
      />
    </div>
  )
}

