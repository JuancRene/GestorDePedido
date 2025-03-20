"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAnalytics } from "@/lib/analytics"
import { LineChart } from "./line-chart"
import { PieChart } from "./pie-chart"
import { DollarSign, Users, ShoppingBag, TrendingUp, AlertCircle } from "lucide-react"
import { DebugPanel } from "./debug-panel"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Add these imports at the top
import { CustomerDetailsModal } from "./customer-details-modal"
import { ProductDetailsModal } from "./product-details-modal"
import { getCustomerDetails, getProductDetails } from "@/lib/analytics"

interface Analytics {
  totalSales: number
  totalCustomers: number
  totalOrders: number
  averageOrderValue: number
  salesByDay: Array<{ date: string; total: number }>
  salesByCategory: Array<{ category: string; total: number }>
  salesByPaymentMethod: Array<{ name: string; value: number; color: string }>
  topProducts: Array<{ name: string; total: number }>
  topCustomers: Array<{ name: string; total: number }>
}

// Add this function
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "365d">("30d")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add these state variables inside the AnalyticsDashboard component
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [customerDetails, setCustomerDetails] = useState(null)
  const [productDetails, setProductDetails] = useState(null)

  // Add these effect handlers
  useEffect(() => {
    if (selectedCustomer) {
      const fetchCustomerDetails = async () => {
        try {
          const details = await getCustomerDetails(selectedCustomer)
          setCustomerDetails(details)
        } catch (error) {
          console.error("Error fetching customer details:", error)
          // Handle the error gracefully
          setCustomerDetails(null)
        }
      }
      fetchCustomerDetails()
    } else {
      setCustomerDetails(null)
    }
  }, [selectedCustomer])

  useEffect(() => {
    if (selectedProduct) {
      const fetchProductDetails = async () => {
        try {
          const details = await getProductDetails(selectedProduct)
          setProductDetails(details)
        } catch (error) {
          console.error("Error fetching product details:", error)
          // Handle the error gracefully
          setProductDetails(null)
        }
      }
      fetchProductDetails()
    } else {
      setProductDetails(null)
    }
  }, [selectedProduct])

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getAnalytics(timeRange)
        setAnalytics(data)
      } catch (error) {
        console.error("Error fetching analytics:", error)
        setError("Error al cargar los datos analíticos. Por favor, intente nuevamente.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [timeRange])

  // Handle time range selection
  const handleTimeRangeChange = (range: "7d" | "30d" | "90d" | "365d") => {
    setTimeRange(range)
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-12 bg-gray-200 rounded-md" />
              </CardContent>
            </Card>
          ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!analytics) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No se pudieron cargar los datos analíticos.</AlertDescription>
      </Alert>
    )
  }

  // Check if we have any data
  const hasData = analytics.totalOrders > 0

  // If no data, show a message
  if (!hasData) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No hay datos de ventas para el período seleccionado. Intente seleccionar un período diferente o crear
            algunos pedidos.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Totales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(0)}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="overview">Vista General</TabsTrigger>
              <TabsTrigger value="sales">Ventas</TabsTrigger>
              <TabsTrigger value="customers">Clientes</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <TabsList>
                <TabsTrigger
                  value="7d"
                  onClick={() => handleTimeRangeChange("7d")}
                  data-state={timeRange === "7d" ? "active" : "inactive"}
                >
                  7D
                </TabsTrigger>
                <TabsTrigger
                  value="30d"
                  onClick={() => handleTimeRangeChange("30d")}
                  data-state={timeRange === "30d" ? "active" : "inactive"}
                >
                  30D
                </TabsTrigger>
                <TabsTrigger
                  value="90d"
                  onClick={() => handleTimeRangeChange("90d")}
                  data-state={timeRange === "90d" ? "active" : "inactive"}
                >
                  90D
                </TabsTrigger>
                <TabsTrigger
                  value="365d"
                  onClick={() => handleTimeRangeChange("365d")}
                  data-state={timeRange === "365d" ? "active" : "inactive"}
                >
                  1A
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(analytics.totalSales)}</div>
                  <p className="text-xs text-muted-foreground">+20.1% respecto al período anterior</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes Totales</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalCustomers}</div>
                  <p className="text-xs text-muted-foreground">+12.5% respecto al período anterior</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">+8.2% respecto al período anterior</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Promedio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(analytics.averageOrderValue)}</div>
                  <p className="text-xs text-muted-foreground">+4.1% respecto al período anterior</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por Día</CardTitle>
                </CardHeader>
                <CardContent>
                  <LineChart data={analytics.salesByDay} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métodos de Pago</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.salesByPaymentMethod.length === 0 ? (
                    <div className="flex items-center justify-center h-[350px] bg-gray-50 rounded-md border border-dashed border-gray-200">
                      <p className="text-gray-500 text-sm">No hay datos de métodos de pago disponibles</p>
                    </div>
                  ) : (
                    <PieChart data={analytics.salesByPaymentMethod} />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
              <Card>
                <CardHeader>
                  <CardTitle>Productos Más Vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.topProducts.length === 0 ? (
                    <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-md border border-dashed border-gray-200">
                      <p className="text-gray-500 text-sm">No hay datos de productos disponibles</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analytics.topProducts.map((product, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                          onClick={() => setSelectedProduct(product.name)}
                        >
                          <span className="font-medium">{product.name}</span>
                          <span>{formatCurrency(product.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
              <Card>
                <CardHeader>
                  <CardTitle>Mejores Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.topCustomers.length === 0 ? (
                    <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-md border border-dashed border-gray-200">
                      <p className="text-gray-500 text-sm">No hay datos de clientes disponibles</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analytics.topCustomers.map((customer, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                          onClick={() => setSelectedCustomer(customer.name)}
                        >
                          <span className="font-medium">{customer.name}</span>
                          <span>{formatCurrency(customer.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por Día</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <LineChart data={analytics.salesByDay} />
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Métodos de Pago</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {analytics.salesByPaymentMethod.length === 0 ? (
                      <div className="flex items-center justify-center h-[350px] bg-gray-50 rounded-md border border-dashed border-gray-200">
                        <p className="text-gray-500 text-sm">No hay datos de métodos de pago disponibles</p>
                      </div>
                    ) : (
                      <PieChart data={analytics.salesByPaymentMethod} />
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Productos Más Vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.topProducts.length === 0 ? (
                    <div className="flex items-center justify-center h-[350px] bg-gray-50 rounded-md border border-dashed border-gray-200">
                      <p className="text-gray-500 text-sm">No hay datos de productos disponibles</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analytics.topProducts.map((product, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                          onClick={() => setSelectedProduct(product.name)}
                        >
                          <span className="font-medium">{product.name}</span>
                          <span>{formatCurrency(product.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mejores Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics.topCustomers.length === 0 ? (
                    <div className="flex items-center justify-center h-[350px] bg-gray-50 rounded-md border border-dashed border-gray-200">
                      <p className="text-gray-500 text-sm">No hay datos de clientes disponibles</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {analytics.topCustomers.map((customer, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between border-b pb-4 last:border-0 cursor-pointer hover:bg-gray-50 p-2 rounded"
                          onClick={() => setSelectedCustomer(customer.name)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center font-bold">
                              {i + 1}
                            </div>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {analytics.totalOrders} pedidos totales
                              </div>
                            </div>
                          </div>
                          <div className="font-bold">{formatCurrency(customer.total)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-normal">Clientes Totales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalCustomers}</div>
                    <p className="text-xs text-muted-foreground">+12.5% respecto al período anterior</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-normal">Valor Promedio por Cliente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(analytics.totalCustomers ? analytics.totalSales / analytics.totalCustomers : 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">+4.1% respecto al período anterior</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <DebugPanel data={analytics} />

        <CustomerDetailsModal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          customer={customerDetails}
        />

        <ProductDetailsModal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          product={productDetails}
        />
      </div>
    </>
  )
}

