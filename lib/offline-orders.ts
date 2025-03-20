"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { indexedDBService } from "./indexeddb-service"
import { v4 as uuidv4 } from "uuid"
import { logger } from "./logger"

const MODULE = "offline-orders"

// Interfaz para los datos de la orden
interface OrderData {
  customer_id: number
  customer_name?: string // Añadimos el nombre del cliente
  items: any[]
  total: number
  delivery_method: "retiro" | "envio"
  delivery_address?: string
  payment_method?: "efectivo" | "debito" | "credito" | "qr"
  cash_amount?: number
  pickup_date: string
  pickup_time?: string
  employee_id?: number
  employee_name?: string
}

// Función para crear una orden con soporte offline
export async function createOrderWithOfflineSupport(
  orderData: OrderData,
): Promise<{ success: boolean; message: string; isOffline?: boolean; orderId?: string | number; error?: any }> {
  logger.info(MODULE, "Creando orden con soporte offline", {
    customerId: orderData.customer_id,
    customerName: orderData.customer_name,
    total: orderData.total,
    itemsCount: orderData.items.length,
  })

  try {
    // Si estamos online, intentar crear la orden en el servidor
    if (navigator.onLine) {
      logger.debug(MODULE, "Dispositivo online, intentando crear orden en el servidor")

      try {
        const supabase = createClientComponentClient()

        // Si no tenemos el nombre del cliente, intentamos obtenerlo
        if (!orderData.customer_name) {
          logger.debug(MODULE, "Obteniendo información del cliente", { customerId: orderData.customer_id })
          const { data: customerData, error: customerError } = await supabase
            .from("customers")
            .select("name")
            .eq("id", orderData.customer_id)
            .single()

          if (customerError) {
            logger.error(MODULE, "Error al obtener información del cliente", { error: customerError })
            throw new Error(`No se pudo obtener el nombre del cliente: ${customerError.message}`)
          }

          if (customerData) {
            orderData.customer_name = customerData.name
            logger.debug(MODULE, "Nombre del cliente obtenido", { customerName: orderData.customer_name })
          }
        }

        // Transform the items to match the database structure
        const transformedItems = orderData.items.map((item) => ({
          product_id: item.id,
          productName: item.name,
          basePrice: item.price,
          quantity: item.quantity,
          removedIngredients: item.removedIngredients || [],
          notes: item.notes || "",
          format_sales: item.format_sales || "Por porción",
          is_by_weight: item.format_sales === "Por KG",
        }))

        // Calcular el total excluyendo productos por peso
        const calculatedTotal = orderData.items.reduce((total, item) => {
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

        // Crear objeto de orden
        const serverOrderData = {
          customer_id: orderData.customer_id,
          customer: orderData.customer_name, // Añadimos el nombre del cliente
          items: transformedItems,
          total: calculatedTotal,
          status: "pending",
          delivery_method: orderData.delivery_method,
          delivery_address: orderData.delivery_address,
          payment_method: orderData.payment_method,
          cash_amount: orderData.cash_amount,
          pickup_date_time: orderData.pickup_time
            ? `${orderData.pickup_date}T${orderData.pickup_time}`
            : `${orderData.pickup_date}T00:00:00`,
          created_at: new Date().toISOString(),
          employee_id: orderData.employee_id,
          time: currentTime, // Añadir el campo time requerido
          date: currentDate, // Añadir el campo date requerido
        }

        logger.debug(MODULE, "Enviando datos de orden al servidor", { serverOrderData })
        const { data, error } = await supabase.from("orders").insert([serverOrderData]).select()

        if (error) {
          logger.error(MODULE, "Error al crear orden en Supabase", { error })
          throw error
        }

        logger.info(MODULE, "Orden creada exitosamente en el servidor", { orderId: data[0].id })
        return {
          success: true,
          message: "Pedido creado exitosamente",
          orderId: data[0].id,
        }
      } catch (serverError) {
        logger.error(MODULE, "Error al crear orden en el servidor, intentando guardar localmente", { serverError })
        // Si falla la creación en el servidor, guardar localmente
        return await saveOrderLocally(orderData)
      }
    } else {
      logger.info(MODULE, "Dispositivo offline, guardando orden localmente")
      // Si estamos offline, guardar localmente
      return await saveOrderLocally(orderData)
    }
  } catch (error) {
    logger.error(MODULE, "Error general al crear orden", { error })
    return {
      success: false,
      message: "Error al crear el pedido: " + (error instanceof Error ? error.message : String(error)),
      error,
    }
  }
}

// Función para guardar una orden localmente
async function saveOrderLocally(
  orderData: OrderData,
): Promise<{ success: boolean; message: string; isOffline: boolean; orderId?: string; error?: any }> {
  logger.debug(MODULE, "Guardando orden localmente")

  try {
    // Generar un ID temporal para la orden
    const tempId = `temp_${uuidv4()}`

    // Obtener la hora actual para el campo time
    const now = new Date()
    const currentTime = now.toTimeString().split(" ")[0] // Formato HH:MM:SS

    // Obtener la fecha actual para el campo date
    const currentDate = now.toISOString().split("T")[0] // Formato YYYY-MM-DD

    // Transformar los datos para guardar localmente
    const localOrderData = {
      id: tempId,
      customer_id: orderData.customer_id,
      customer: orderData.customer_name, // Añadimos el nombre del cliente
      items: orderData.items.map((item) => ({
        product_id: item.id,
        productName: item.name,
        basePrice: item.price,
        quantity: item.quantity,
        removedIngredients: item.removedIngredients || [],
        notes: item.notes || "",
        format_sales: item.format_sales || "Por porción",
        is_by_weight: item.format_sales === "Por KG",
      })),
      total: orderData.total,
      status: "pending",
      delivery_method: orderData.delivery_method,
      delivery_address: orderData.delivery_address,
      payment_method: orderData.payment_method,
      cash_amount: orderData.cash_amount,
      pickup_date_time: orderData.pickup_time
        ? `${orderData.pickup_date}T${orderData.pickup_time}`
        : `${orderData.pickup_date}T00:00:00`,
      created_at: new Date().toISOString(),
      employee_id: orderData.employee_id,
      employee_name: orderData.employee_name,
      time: currentTime, // Añadir el campo time requerido
      date: currentDate, // Añadir el campo date requerido
      isPendingSync: true,
    }

    logger.debug(MODULE, "Guardando orden en IndexedDB", { tempId })
    await indexedDBService.saveOrder(localOrderData)

    // Marcar para sincronización cuando vuelva la conexión
    await indexedDBService.addToSyncQueue({
      type: "create_order",
      data: localOrderData,
      timestamp: Date.now(),
    })

    logger.info(MODULE, "Orden guardada localmente con éxito", { tempId })
    return {
      success: true,
      message: "Pedido guardado localmente. Se sincronizará cuando haya conexión.",
      isOffline: true,
      orderId: tempId,
    }
  } catch (error) {
    logger.error(MODULE, "Error al guardar orden localmente", { error })
    return {
      success: false,
      message: "Error al guardar el pedido localmente: " + (error instanceof Error ? error.message : String(error)),
      isOffline: true,
      error,
    }
  }
}

