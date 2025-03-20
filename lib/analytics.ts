"use server"

import { createClient } from "@/lib/supabase"

export async function getAnalytics(timeRange: "7d" | "30d" | "90d" | "365d") {
  const supabase = createClient()
  const now = new Date()
  const startDate = new Date()

  // Calculate start date based on time range
  switch (timeRange) {
    case "7d":
      startDate.setDate(now.getDate() - 7)
      break
    case "30d":
      startDate.setDate(now.getDate() - 30)
      break
    case "90d":
      startDate.setDate(now.getDate() - 90)
      break
    case "365d":
      startDate.setDate(now.getDate() - 365)
      break
  }

  try {
    console.log("Fetching analytics data from:", startDate.toISOString(), "to:", now.toISOString())

    // Get total sales and orders with items
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        total,
        items,
        created_at,
        payment_method,
        customer:customers(name)
      `)
      .gte("created_at", startDate.toISOString())
      .eq("status", "completed")

    if (ordersError) {
      console.error("Error fetching orders:", ordersError)
      throw ordersError
    }

    console.log("Fetched orders:", ordersData.length)

    // Debug the structure of the first order's items
    if (ordersData.length > 0) {
      console.log("First order items structure:", JSON.stringify(ordersData[0].items, null, 2))
    }

    // Calculate total sales
    const totalSales = ordersData.reduce((sum, order) => sum + (order.total || 0), 0)
    console.log("Total sales:", totalSales)

    // Get total customers (only count customers with orders in the period)
    const uniqueCustomers = new Set(ordersData.map((order) => order.customer?.name).filter(Boolean))
    const totalCustomers = uniqueCustomers.size
    console.log("Total customers:", totalCustomers)

    // Total orders is simply the length of ordersData
    const totalOrders = ordersData.length
    console.log("Total orders:", totalOrders)

    // Calculate average order value
    const averageOrderValue = totalOrders ? totalSales / totalOrders : 0
    console.log("Average order value:", averageOrderValue)

    // Process sales by payment method
    const paymentMethodTotals = new Map<string, number>()
    ordersData.forEach((order) => {
      const method = order.payment_method || "No especificado"
      paymentMethodTotals.set(method, (paymentMethodTotals.get(method) || 0) + (order.total || 0))
    })

    // Definir un mapa de normalización para métodos de pago
    const paymentMethodNormalization: Record<string, { name: string; color: string }> = {
      cash: { name: "Efectivo", color: "#dc2626" },
      efectivo: { name: "Efectivo", color: "#dc2626" },
      debit: { name: "Débito", color: "#111827" },
      debito: { name: "Débito", color: "#111827" },
      credit: { name: "Crédito", color: "#374151" },
      credito: { name: "Crédito", color: "#374151" },
      qr: { name: "QR", color: "#4b5563" },
      "no especificado": { name: "No especificado", color: "#6b7280" },
    }

    const salesByPaymentMethod = Array.from(paymentMethodTotals.entries())
      .map(([method, total]) => {
        // Normalizar el método de pago
        const methodLower = method.toLowerCase()
        const normalized = paymentMethodNormalization[methodLower] || { name: method, color: "#6b7280" }

        return {
          name: normalized.name,
          value: total,
          color: normalized.color,
        }
      })
      .sort((a, b) => b.value - a.value)

    console.log("Sales by payment method:", salesByPaymentMethod)

    // Process sales by day
    const salesByDay = new Map<string, number>()
    ordersData.forEach((order) => {
      const date = new Date(order.created_at).toLocaleDateString("es-AR")
      salesByDay.set(date, (salesByDay.get(date) || 0) + (order.total || 0))
    })

    const salesByDayArray = Array.from(salesByDay.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    console.log("Sales by day:", salesByDayArray)

    // Process sales by category
    const categoryTotals = new Map<string, number>()

    // Añadir log para depuración
    console.log("Procesando categorías de productos...")

    ordersData.forEach((order) => {
      let items = order.items

      // Handle string items (parse JSON if needed)
      if (typeof items === "string") {
        try {
          items = JSON.parse(items)
        } catch (e) {
          console.error("Failed to parse items string:", e)
          items = []
        }
      }

      // Ensure items is an array
      if (!Array.isArray(items)) {
        console.warn("Order items is not an array for order:", order.id)
        return
      }

      items.forEach((item: any) => {
        if (!item) {
          console.warn("Invalid item in order:", order.id)
          return
        }

        // Depurar la estructura del item para ver dónde está la categoría
        console.log("Item structure:", JSON.stringify(item, null, 2))

        // Buscar la categoría en diferentes lugares posibles
        let category = "Sin categoría"

        if (item.category) {
          category = item.category
        } else if (item.product && item.product.category) {
          category = item.product.category
        } else if (item.productCategory) {
          category = item.productCategory
        }

        // Si la categoría está vacía, usar "Sin categoría"
        if (!category || category.trim() === "") {
          category = "Sin categoría"
        }

        console.log(
          `Categoría encontrada: "${category}" para producto: ${item.productName || item.name || "Desconocido"}`,
        )

        // Calculate item total based on available fields
        const price = item.basePrice || item.price || 0
        const quantity = item.quantity || 1
        const itemTotal = price * quantity

        categoryTotals.set(category, (categoryTotals.get(category) || 0) + itemTotal)
      })
    })

    const salesByCategory = Array.from(categoryTotals.entries())
      .map(([category, total]) => ({
        category,
        total,
      }))
      .sort((a, b) => b.total - a.total)

    console.log("Sales by category:", salesByCategory)

    // Process top products
    const productTotals = new Map<string, number>()

    ordersData.forEach((order) => {
      let items = order.items

      // Handle string items (parse JSON if needed)
      if (typeof items === "string") {
        try {
          items = JSON.parse(items)
        } catch (e) {
          console.error("Failed to parse items string:", e)
          items = []
        }
      }

      // Ensure items is an array
      if (!Array.isArray(items)) {
        return
      }

      items.forEach((item: any) => {
        if (!item) return

        // Try different possible name fields
        const productName =
          item.productName || item.name || (item.product && item.product.name) || "Producto sin nombre"

        // Calculate item total based on available fields
        const price = item.basePrice || item.price || 0
        const quantity = item.quantity || 1
        const itemTotal = price * quantity

        productTotals.set(productName, (productTotals.get(productName) || 0) + itemTotal)
      })
    })

    const topProducts = Array.from(productTotals.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    console.log("Top products:", topProducts)

    // Process top customers
    const customerTotals = new Map<string, number>()
    ordersData.forEach((order) => {
      const customerName = order.customer?.name || "Cliente eliminado"
      customerTotals.set(customerName, (customerTotals.get(customerName) || 0) + (order.total || 0))
    })

    const topCustomers = Array.from(customerTotals.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    console.log("Top customers:", topCustomers)

    const analytics = {
      totalSales,
      totalCustomers,
      totalOrders,
      averageOrderValue,
      salesByDay: salesByDayArray,
      salesByCategory,
      salesByPaymentMethod,
      topProducts,
      topCustomers,
    }

    console.log("Final analytics data:", analytics)

    return analytics
  } catch (error) {
    console.error("Error in getAnalytics:", error)
    // Return default values instead of throwing
    return {
      totalSales: 0,
      totalCustomers: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      salesByDay: [],
      salesByCategory: [],
      salesByPaymentMethod: [],
      topProducts: [],
      topCustomers: [],
    }
  }
}

// Change the getCustomerDetails function to accept a name instead of an ID
export async function getCustomerDetails(customerName: string) {
  const supabase = createClient()

  try {
    // Get customer orders with details
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        id,
        total,
        items,
        created_at,
        payment_method,
        delivery_method,
        customer:customers(name)
      `)
      .eq("customer.name", customerName)
      .order("created_at", { ascending: false })

    if (error) throw error

    // If no orders found, try a different approach
    if (!orders || orders.length === 0) {
      // First get the customer ID by name
      const { data: customers, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .ilike("name", customerName)
        .limit(1)

      if (customerError) throw customerError

      if (!customers || customers.length === 0) {
        return null
      }

      const customerId = customers[0].id

      // Then get orders by customer ID
      const { data: customerOrders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id,
          total,
          items,
          created_at,
          payment_method,
          delivery_method,
          customer:customers(name)
        `)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })

      if (ordersError) throw ordersError

      if (!customerOrders || customerOrders.length === 0) {
        return {
          name: customerName,
          totalOrders: 0,
          totalSpent: 0,
          orders: [],
        }
      }

      // Transform the data
      const transformedOrders = customerOrders.map((order) => {
        let items = order.items

        // Parse items if it's a string
        if (typeof items === "string") {
          try {
            items = JSON.parse(items)
          } catch (e) {
            console.error("Failed to parse items string:", e)
            items = []
          }
        }

        return {
          id: order.id,
          date: order.created_at,
          total: order.total || 0,
          items: Array.isArray(items) ? items : [],
          payment_method: order.payment_method || "No especificado",
          delivery_method: order.delivery_method || "No especificado",
        }
      })

      const totalSpent = transformedOrders.reduce((sum, order) => sum + order.total, 0)

      return {
        name: customerName,
        totalOrders: transformedOrders.length,
        totalSpent,
        orders: transformedOrders,
      }
    }

    // Transform the data
    const customerOrders = orders.map((order) => {
      let items = order.items

      // Parse items if it's a string
      if (typeof items === "string") {
        try {
          items = JSON.parse(items)
        } catch (e) {
          console.error("Failed to parse items string:", e)
          items = []
        }
      }

      return {
        id: order.id,
        date: order.created_at,
        total: order.total || 0,
        items: Array.isArray(items) ? items : [],
        payment_method: order.payment_method || "No especificado",
        delivery_method: order.delivery_method || "No especificado",
      }
    })

    const totalSpent = customerOrders.reduce((sum, order) => sum + order.total, 0)

    return {
      name: customerName,
      totalOrders: orders.length,
      totalSpent,
      orders: customerOrders,
    }
  } catch (error) {
    console.error("Error fetching customer details:", error)
    return null
  }
}

// Update the getProductDetails function to handle JSON parsing issues
export async function getProductDetails(productName: string) {
  const supabase = createClient()

  try {
    // Get all orders containing this product
    const { data: orders, error } = await supabase
      .from("orders")
      .select(`
        id,
        items,
        created_at,
        payment_method,
        customer:customers(name)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    let totalSold = 0
    let totalRevenue = 0
    const variations: Record<string, number> = {}
    const productOrders: Array<{
      orderId: number
      date: string
      customerName: string
      quantity: number
      notes?: string
      removedIngredients?: string[]
      payment_method: string
    }> = []

    orders.forEach((order) => {
      let items = order.items

      // Handle string items (parse JSON if needed)
      if (typeof items === "string") {
        try {
          items = JSON.parse(items)
        } catch (e) {
          console.error("Failed to parse items string:", e)
          items = []
        }
      }

      // Ensure items is an array
      if (!Array.isArray(items)) {
        console.warn("Order items is not an array for order:", order.id)
        return
      }

      items.forEach((item: any) => {
        if (!item) return

        // Try different possible name fields
        const itemProductName =
          item.productName || item.name || (item.product && item.product.name) || "Producto sin nombre"

        if (itemProductName === productName) {
          const quantity = item.quantity || 1
          totalSold += quantity

          const price = item.basePrice || item.price || 0
          totalRevenue += price * quantity

          // Track variations
          if (item.removedIngredients?.length) {
            const key = `Sin: ${item.removedIngredients.join(", ")}`
            variations[key] = (variations[key] || 0) + quantity
          }
          if (item.notes) {
            variations[item.notes] = (variations[item.notes] || 0) + quantity
          }

          // Add to orders list
          productOrders.push({
            orderId: order.id,
            date: order.created_at,
            customerName: order.customer?.name || "Cliente desconocido",
            quantity: quantity,
            notes: item.notes,
            removedIngredients: item.removedIngredients,
            payment_method: order.payment_method || "No especificado",
          })
        }
      })
    })

    // Transform variations into array
    const variationsArray = Object.entries(variations)
      .map(([value, count]) => ({
        type: value.startsWith("Sin:") ? ("removed" as const) : ("note" as const),
        value,
        count,
      }))
      .sort((a, b) => b.count - a.count)

    return {
      name: productName,
      totalSold,
      totalRevenue,
      averagePrice: totalSold ? totalRevenue / totalSold : 0,
      orders: productOrders,
      variations: variationsArray,
    }
  } catch (error) {
    console.error("Error fetching product details:", error)
    return null
  }
}

