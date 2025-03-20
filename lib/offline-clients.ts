"use client"

import { indexedDBService } from "./indexeddb-service"
import { syncService } from "./sync-service"
import type { Customer } from "@/types/order"
import { toast } from "@/hooks/use-toast"

// Obtener clientes con soporte offline
export async function getClientsWithOfflineSupport(): Promise<Customer[]> {
  try {
    // Si estamos online, intentar sincronizar primero
    if (navigator.onLine) {
      try {
        await syncService.syncFromServer()
      } catch (error) {
        console.error("Error al sincronizar clientes desde el servidor:", error)
      }
    }

    // Obtener clientes de IndexedDB
    const clients = await indexedDBService.getAllCustomers()
    return clients
  } catch (error) {
    console.error("Error al obtener clientes:", error)
    toast({
      title: "Error",
      description: "No se pudieron cargar los clientes",
      variant: "destructive",
    })
    return []
  }
}

// Buscar clientes con soporte offline
export async function searchClientsWithOfflineSupport(query: string): Promise<Customer[]> {
  try {
    // Buscar en IndexedDB
    const clients = await indexedDBService.searchCustomers(query)
    return clients
  } catch (error) {
    console.error("Error al buscar clientes:", error)
    return []
  }
}

// Crear cliente con soporte offline
export async function createCustomerWithOfflineSupport(client: Omit<Customer, "id" | "created_at">): Promise<{
  success: boolean
  message: string
  customer?: Customer
  isOffline: boolean
}> {
  try {
    // Crear cliente sin ID (se generará uno temporal negativo)
    const newCustomer: Customer = {
      ...client,
      id: 0, // Se asignará un ID temporal en indexedDBService
      created_at: new Date().toISOString(),
    }

    // Guardar en IndexedDB
    const customerId = await indexedDBService.saveCustomer(newCustomer)

    // Obtener el cliente con el ID asignado
    const savedCustomer = await indexedDBService.getCustomerById(customerId)

    if (!savedCustomer) {
      return {
        success: false,
        message: "Error al guardar el cliente",
        isOffline: !navigator.onLine,
      }
    }

    // Si estamos online, intentar sincronizar inmediatamente
    if (navigator.onLine) {
      try {
        await syncService.syncToServer()
        return {
          success: true,
          message: "Cliente creado y sincronizado con el servidor",
          customer: savedCustomer,
          isOffline: false,
        }
      } catch (error) {
        console.error("Error al sincronizar cliente con el servidor:", error)
        return {
          success: true,
          message: "Cliente creado localmente, pero no se pudo sincronizar con el servidor",
          customer: savedCustomer,
          isOffline: true,
        }
      }
    } else {
      // Si estamos offline, informar que se guardó localmente
      return {
        success: true,
        message: "Cliente guardado localmente. Se sincronizará cuando haya conexión.",
        customer: savedCustomer,
        isOffline: true,
      }
    }
  } catch (error) {
    console.error("Error al crear cliente:", error)
    return {
      success: false,
      message: "Error al crear el cliente: " + (error instanceof Error ? error.message : "Error desconocido"),
      isOffline: !navigator.onLine,
    }
  }
}

// Actualizar cliente con soporte offline
export async function updateClientWithOfflineSupport(
  id: number,
  clientData: Partial<Customer>,
): Promise<{
  success: boolean
  message: string
  isOffline: boolean
}> {
  try {
    // Actualizar en IndexedDB
    const updated = await indexedDBService.updateCustomer(id, clientData)

    if (!updated) {
      return {
        success: false,
        message: "No se encontró el cliente para actualizar",
        isOffline: !navigator.onLine,
      }
    }

    // Si estamos online, intentar sincronizar inmediatamente
    if (navigator.onLine) {
      try {
        await syncService.syncToServer()
        return {
          success: true,
          message: "Cliente actualizado y sincronizado con el servidor",
          isOffline: false,
        }
      } catch (error) {
        console.error("Error al sincronizar cliente con el servidor:", error)
        return {
          success: true,
          message: "Cliente actualizado localmente, pero no se pudo sincronizar con el servidor",
          isOffline: true,
        }
      }
    } else {
      // Si estamos offline, informar que se guardó localmente
      return {
        success: true,
        message: "Cliente actualizado localmente. Se sincronizará cuando haya conexión.",
        isOffline: true,
      }
    }
  } catch (error) {
    console.error("Error al actualizar cliente:", error)
    return {
      success: false,
      message: "Error al actualizar el cliente: " + (error instanceof Error ? error.message : "Error desconocido"),
      isOffline: !navigator.onLine,
    }
  }
}

// Eliminar cliente con soporte offline
export async function deleteClientWithOfflineSupport(id: number): Promise<{
  success: boolean
  message: string
  isOffline: boolean
}> {
  try {
    // Verificar si tiene pedidos asociados
    const orders = await indexedDBService.getAllOrders()
    const hasOrders = orders.some((order) => order.customer_id === id)

    if (hasOrders) {
      return {
        success: false,
        message: "No se puede eliminar el cliente porque tiene pedidos asociados",
        isOffline: !navigator.onLine,
      }
    }

    // Eliminar de IndexedDB
    const deleted = await indexedDBService.deleteCustomer(id)

    if (!deleted) {
      return {
        success: false,
        message: "No se encontró el cliente para eliminar",
        isOffline: !navigator.onLine,
      }
    }

    // Si estamos online, intentar sincronizar inmediatamente
    if (navigator.onLine) {
      try {
        await syncService.syncToServer()
        return {
          success: true,
          message: "Cliente eliminado y sincronizado con el servidor",
          isOffline: false,
        }
      } catch (error) {
        console.error("Error al sincronizar eliminación con el servidor:", error)
        return {
          success: true,
          message: "Cliente eliminado localmente, pero no se pudo sincronizar con el servidor",
          isOffline: true,
        }
      }
    } else {
      // Si estamos offline, informar que se eliminó localmente
      return {
        success: true,
        message: "Cliente eliminado localmente. Se sincronizará cuando haya conexión.",
        isOffline: true,
      }
    }
  } catch (error) {
    console.error("Error al eliminar cliente:", error)
    return {
      success: false,
      message: "Error al eliminar el cliente: " + (error instanceof Error ? error.message : "Error desconocido"),
      isOffline: !navigator.onLine,
    }
  }
}

