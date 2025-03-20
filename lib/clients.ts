"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Customer } from "@/types/order"
import { indexedDBService } from "./indexeddb-service"
import { revalidatePath } from "next/cache"
import { logger } from "./logger"

const MODULE = "clients-service"

// Función para obtener clientes con soporte offline
export async function getClients(): Promise<Customer[]> {
  try {
    logger.info(MODULE, "Obteniendo clientes")

    // Intentar obtener clientes del servidor si estamos online
    if (navigator.onLine) {
      logger.debug(MODULE, "Dispositivo online, intentando obtener clientes del servidor")
      const supabase = createClientComponentClient()
      const { data, error } = await supabase.from("customers").select("*").order("name")

      if (error) {
        logger.error(MODULE, "Error al obtener clientes del servidor", { error })
        throw error
      }

      // Guardar clientes en IndexedDB para uso offline
      if (data) {
        logger.info(MODULE, `Obtenidos ${data.length} clientes del servidor`)
        try {
          await indexedDBService.saveAllCustomers(data)
          logger.debug(MODULE, "Clientes guardados en IndexedDB")
        } catch (dbError) {
          logger.error(MODULE, "Error al guardar clientes en IndexedDB", { dbError })
        }
        return data
      }
    } else {
      logger.info(MODULE, "Dispositivo offline, usando datos locales")
    }

    // Si estamos offline o la petición falló, usar datos locales
    logger.debug(MODULE, "Obteniendo clientes de IndexedDB")
    const localCustomers = await indexedDBService.getAllCustomers()
    logger.info(MODULE, `Obtenidos ${localCustomers.length} clientes de IndexedDB`)
    return localCustomers
  } catch (error) {
    logger.error(MODULE, "Error general al obtener clientes", { error })

    // En caso de error, intentar usar datos locales
    try {
      logger.debug(MODULE, "Intentando recuperar clientes de IndexedDB después de error")
      const localCustomers = await indexedDBService.getAllCustomers()
      logger.info(MODULE, `Recuperados ${localCustomers.length} clientes de IndexedDB después de error`)
      return localCustomers
    } catch (dbError) {
      logger.error(MODULE, "Error al recuperar clientes de IndexedDB después de error inicial", { dbError })
      return []
    }
  }
}

// Función para buscar clientes con soporte offline
export async function searchClients(query: string): Promise<Customer[]> {
  try {
    logger.info(MODULE, "Buscando clientes", { query })

    // Intentar buscar en el servidor si estamos online
    if (navigator.onLine) {
      logger.debug(MODULE, "Dispositivo online, buscando clientes en el servidor", { query })
      const supabase = createClientComponentClient()
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%,address.ilike.%${query}%`)
        .order("name")

      if (error) {
        logger.error(MODULE, "Error al buscar clientes en el servidor", { error, query })
        throw error
      }

      if (data) {
        logger.info(MODULE, `Encontrados ${data.length} clientes en el servidor`, { query })
        return data
      }
    } else {
      logger.info(MODULE, "Dispositivo offline, buscando en datos locales", { query })
    }

    // Si estamos offline o la petición falló, buscar en datos locales
    logger.debug(MODULE, "Buscando clientes en IndexedDB", { query })
    const localCustomers = await indexedDBService.searchCustomers(query)
    logger.info(MODULE, `Encontrados ${localCustomers.length} clientes en IndexedDB`, { query })
    return localCustomers
  } catch (error) {
    logger.error(MODULE, "Error general al buscar clientes", { error, query })

    // En caso de error, buscar en datos locales
    try {
      logger.debug(MODULE, "Intentando buscar clientes en IndexedDB después de error", { query })
      const localCustomers = await indexedDBService.searchCustomers(query)
      logger.info(MODULE, `Encontrados ${localCustomers.length} clientes en IndexedDB después de error`, { query })
      return localCustomers
    } catch (dbError) {
      logger.error(MODULE, "Error al buscar clientes en IndexedDB después de error inicial", { dbError, query })
      return []
    }
  }
}

export async function createCustomer(
  client: Omit<Customer, "id" | "created_at">,
): Promise<{ success: boolean; customer?: Customer; error?: any }> {
  logger.info(MODULE, "Creando cliente", { client })

  try {
    const supabase = createClientComponentClient()
    const { data, error } = await supabase.from("customers").insert([client]).select()

    if (error) {
      logger.error(MODULE, "Error al crear cliente en Supabase", { error, client })
      return { success: false, error }
    }

    logger.info(MODULE, "Cliente creado exitosamente en Supabase", { customerId: data[0].id })

    // Intentar guardar en IndexedDB para uso offline
    try {
      await indexedDBService.saveCustomer(data[0])
      logger.debug(MODULE, "Cliente guardado en IndexedDB", { customerId: data[0].id })
    } catch (dbError) {
      logger.warn(MODULE, "Error al guardar cliente en IndexedDB", { dbError, customerId: data[0].id })
      // No fallamos la operación si solo falla el guardado local
    }

    try {
      revalidatePath("/admin/clientes")
      revalidatePath("/admin")
      logger.debug(MODULE, "Rutas revalidadas después de crear cliente")
    } catch (revalidateError) {
      logger.warn(MODULE, "Error al revalidar rutas", { revalidateError })
    }

    return { success: true, customer: data[0] }
  } catch (error) {
    logger.error(MODULE, "Error general al crear cliente", { error, client })
    return { success: false, error }
  }
}

export async function updateClient(id: number, client: Partial<Customer>): Promise<{ success: boolean; error?: any }> {
  logger.info(MODULE, "Actualizando cliente", { id, client })

  try {
    const supabase = createClientComponentClient()
    const { error } = await supabase.from("customers").update(client).eq("id", id)

    if (error) {
      logger.error(MODULE, "Error al actualizar cliente en Supabase", { error, id, client })
      return { success: false, error }
    }

    logger.info(MODULE, "Cliente actualizado exitosamente en Supabase", { id })

    // Actualizar en IndexedDB
    try {
      // Primero obtenemos el cliente completo
      const { data } = await supabase.from("customers").select("*").eq("id", id).single()
      if (data) {
        await indexedDBService.saveCustomer(data)
        logger.debug(MODULE, "Cliente actualizado en IndexedDB", { id })
      }
    } catch (dbError) {
      logger.warn(MODULE, "Error al actualizar cliente en IndexedDB", { dbError, id })
    }

    try {
      revalidatePath("/admin/clientes")
      revalidatePath("/admin")
      logger.debug(MODULE, "Rutas revalidadas después de actualizar cliente")
    } catch (revalidateError) {
      logger.warn(MODULE, "Error al revalidar rutas", { revalidateError })
    }

    return { success: true }
  } catch (error) {
    logger.error(MODULE, "Error general al actualizar cliente", { error, id, client })
    return { success: false, error }
  }
}

export async function deleteClient(id: number): Promise<{ success: boolean; message?: string; error?: any }> {
  logger.info(MODULE, "Eliminando cliente", { id })

  try {
    const supabase = createClientComponentClient()

    // Verificar si el cliente tiene pedidos asociados
    logger.debug(MODULE, "Verificando si el cliente tiene pedidos asociados", { id })
    const hasOrders = await customerHasOrders(id)

    if (hasOrders) {
      logger.warn(MODULE, "No se puede eliminar el cliente porque tiene pedidos asociados", { id })
      return {
        success: false,
        message: "No se puede eliminar el cliente porque tiene pedidos asociados.",
      }
    }

    // Realizar la eliminación en Supabase
    const { error } = await supabase.from("customers").delete().eq("id", id)

    if (error) {
      logger.error(MODULE, "Error al eliminar cliente en Supabase", { error, id })
      return {
        success: false,
        message: "Error al eliminar el cliente: " + error.message,
        error,
      }
    }

    logger.info(MODULE, "Cliente eliminado exitosamente en Supabase", { id })

    // Eliminar de IndexedDB
    try {
      await indexedDBService.deleteCustomer(id)
      logger.debug(MODULE, "Cliente eliminado de IndexedDB", { id })
    } catch (dbError) {
      logger.warn(MODULE, "Error al eliminar cliente de IndexedDB", { dbError, id })
    }

    try {
      revalidatePath("/admin/clientes")
      revalidatePath("/admin")
      logger.debug(MODULE, "Rutas revalidadas después de eliminar cliente")
    } catch (revalidateError) {
      logger.warn(MODULE, "Error al revalidar rutas", { revalidateError })
    }

    return { success: true }
  } catch (error) {
    logger.error(MODULE, "Error general al eliminar cliente", { error, id })
    return {
      success: false,
      message: "Error inesperado al eliminar el cliente",
      error,
    }
  }
}

export async function customerHasOrders(customerId: number): Promise<boolean> {
  logger.debug(MODULE, "Verificando si el cliente tiene pedidos", { customerId })

  try {
    const supabase = createClientComponentClient()

    const { data, error, count } = await supabase
      .from("orders")
      .select("id", { count: "exact" })
      .eq("customer_id", customerId)
      .limit(1)

    if (error) {
      logger.error(MODULE, "Error al verificar si el cliente tiene pedidos", { error, customerId })
      return false
    }

    logger.debug(MODULE, `Cliente ${customerId} tiene ${count || 0} pedidos`)
    return (count || 0) > 0
  } catch (error) {
    logger.error(MODULE, "Error general al verificar si el cliente tiene pedidos", { error, customerId })
    return false
  }
}

