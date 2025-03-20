"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

interface OrderItemInput {
  id: number
  name: string
  price: number
  quantity: number
  removedIngredients?: string[]
  notes?: string
  category: string
  ingredients: string[]
  format_sales: string
}

// Modificar la función getOrders para que no intente seleccionar la columna employee_id si no existe

export async function getOrders(status?: "pending" | "completed") {
  try {
    const supabase = createClient()

    // Construir la consulta base
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false })

    // Aplicar filtro de estado si se proporciona
    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching orders:", error)
      return []
    }

    // Transformar los datos para el formato esperado por la UI
    return data.map((order) => ({
      id: order.id,
      customer: order.customer_name || "Cliente",
      customer_id: order.customer_id,
      items: order.items || [],
      total: order.total || 0,
      status: order.status || "pending",
      created_at: order.created_at,
      delivery_method: order.delivery_method,
      delivery_address: order.delivery_address,
      payment_method: order.payment_method,
      cash_amount: order.cash_amount,
      pickup_date_time: order.pickup_date_time,
      employee_id: order.employee_id,
      employee_name: order.employee_name,
    }))
  } catch (error) {
    console.error("Error in getOrders:", error)
    return []
  }
}

// Optimizar la función updateOrderStatus para que sea más eficiente
export async function updateOrderStatus(
  orderId: string,
  status: "pending" | "in-progress" | "completed" | "cancelled",
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    console.log(`Actualizando pedido ${orderId} a estado: ${status}`)

    const { error, data } = await supabase.from("orders").update({ status }).eq("id", orderId).select()

    if (error) {
      console.error("Error al actualizar estado:", error)
      throw error
    }

    console.log("Actualización exitosa:", data)

    // Revalidar solo las rutas necesarias
    revalidatePath("/admin")
    revalidatePath("/cocina")
    revalidatePath("/empleado")

    return {
      success: true,
      message: "Estado actualizado exitosamente",
    }
  } catch (error) {
    console.error("Error updating order status:", error)
    return {
      success: false,
      message: "Error al actualizar el estado",
    }
  }
}

// Modificar la función createOrder para incluir el campo "date" requerido

export async function createOrder(formData: {
  customer_id: number
  customer_name: string
  items: OrderItemInput[]
  total: number
  delivery_method: "retiro" | "envio"
  delivery_address?: string
  payment_method?: "efectivo" | "debito" | "credito" | "qr"
  cash_amount?: number
  pickup_date: string
  pickup_time?: string
  employee_id?: number
  employee_name?: string
}): Promise<{ success: boolean; message: string; orderId?: number }> {
  const supabase = createClient()

  try {
    // Transform the items to match the database structure
    const transformedItems = formData.items.map((item) => ({
      product_id: item.id,
      productName: item.name,
      basePrice: item.price,
      quantity: item.quantity,
      removedIngredients: item.removedIngredients || [],
      notes: item.notes || "",
      format_sales: item.format_sales || "Por porción", // Añadir formato de venta
      is_by_weight: item.format_sales === "Por KG", // Indicar si es por peso
    }))

    // Calcular el total excluyendo productos por peso
    const calculatedTotal = formData.items.reduce((total, item) => {
      if (item.format_sales === "Por KG") {
        return total
      }
      return total + item.price * item.quantity
    }, 0)

    // Obtener la hora actual para el campo time
    const now = new Date()
    const currentTime = now.toTimeString().split(" ")[0] // Formato HH:MM:SS

    // Obtener la fecha actual para el campo date
    const currentDate = now.toISOString().split("T")[0] // Formato YYYY-MM-DD

    // Crear objeto de orden con los campos requeridos
    const orderData = {
      customer_id: formData.customer_id,
      customer: formData.customer_name,
      items: transformedItems,
      total: calculatedTotal,
      status: "pending",
      delivery_method: formData.delivery_method,
      delivery_address: formData.delivery_address,
      payment_method: formData.payment_method,
      cash_amount: formData.cash_amount,
      pickup_date_time: formData.pickup_time
        ? `${formData.pickup_date}T${formData.pickup_time}`
        : `${formData.pickup_date}T00:00:00`,
      created_at: new Date().toISOString(),
      employee_id: formData.employee_id,
      time: currentTime, // Añadir el campo time requerido
      date: currentDate, // Añadir el campo date requerido
    }

    const { data, error } = await supabase.from("orders").insert([orderData]).select()

    if (error) throw error

    revalidatePath("/admin")
    revalidatePath("/cocina")
    revalidatePath("/empleado")

    return {
      success: true,
      message: "Pedido creado exitosamente",
      orderId: data[0]?.id,
    }
  } catch (error) {
    console.error("Error creating order:", error)
    return {
      success: false,
      message: "Error al crear el pedido",
    }
  }
}

export async function deleteOrder(orderId: string): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("orders").delete().eq("id", orderId)

    if (error) throw error

    revalidatePath("/admin")
    revalidatePath("/cocina")
    revalidatePath("/empleado")
    return {
      success: true,
      message: "Pedido eliminado exitosamente",
    }
  } catch (error) {
    console.error("Error deleting order:", error)
    return {
      success: false,
      message: "Error al eliminar el pedido",
    }
  }
}

export async function updateOrder(
  orderId: string,
  data: {
    delivery_method?: "retiro" | "envio"
    delivery_address?: string
    payment_method?: "efectivo" | "debito" | "credito" | "qr"
    cash_amount?: number
    pickup_date_time?: string
    time?: string
    date?: string
  },
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient()

  try {
    console.log("Actualizando orden:", orderId, "con datos:", data)

    // Crear un objeto con solo los campos que no son undefined
    const updateData: Record<string, any> = {}

    if (data.delivery_method !== undefined) updateData.delivery_method = data.delivery_method
    if (data.delivery_address !== undefined) updateData.delivery_address = data.delivery_address
    if (data.payment_method !== undefined) updateData.payment_method = data.payment_method
    if (data.cash_amount !== undefined) updateData.cash_amount = data.cash_amount
    if (data.pickup_date_time !== undefined) updateData.pickup_date_time = data.pickup_date_time
    if (data.time !== undefined) updateData.time = data.time
    if (data.date !== undefined) updateData.date = data.date

    console.log("Datos filtrados para actualizar:", updateData)

    const { error } = await supabase.from("orders").update(updateData).eq("id", orderId)

    if (error) {
      console.error("Error de Supabase al actualizar:", error)
      throw error
    }

    revalidatePath("/admin")
    revalidatePath("/cocina")
    revalidatePath("/empleado")

    return {
      success: true,
      message: "Pedido actualizado exitosamente",
    }
  } catch (error) {
    console.error("Error updating order:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al actualizar el pedido",
    }
  }
}

