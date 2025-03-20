"use client"

import { indexedDBService } from "./indexeddb-service"
import { createOrder, updateOrder, deleteOrder } from "./orders"
import { getProducts, createProduct, updateProduct, deleteProduct } from "./products"
import { getClients, createCustomer, updateClient, deleteClient } from "./clients"

export const syncService = {
  // Sincronizar productos desde el servidor
  async syncProductsFromServer(): Promise<{ success: boolean; count: number }> {
    try {
      // Solo sincronizar si estamos online
      if (!navigator.onLine) {
        return {
          success: false,
          count: 0,
        }
      }

      // Obtener productos del servidor
      const products = await getProducts()
      await indexedDBService.saveAllProducts(products)

      return {
        success: true,
        count: products.length,
      }
    } catch (error) {
      console.error("Error sincronizando productos desde el servidor:", error)
      return {
        success: false,
        count: 0,
      }
    }
  },

  // Sincronizar clientes desde el servidor
  async syncCustomersFromServer(): Promise<{ success: boolean; count: number }> {
    try {
      // Solo sincronizar si estamos online
      if (!navigator.onLine) {
        return {
          success: false,
          count: 0,
        }
      }

      // Obtener clientes del servidor
      const customers = await getClients()
      await indexedDBService.saveAllCustomers(customers)

      return {
        success: true,
        count: customers.length,
      }
    } catch (error) {
      console.error("Error sincronizando clientes desde el servidor:", error)
      return {
        success: false,
        count: 0,
      }
    }
  },

  // Sincronizar órdenes desde el servidor
  async syncOrdersFromServer(): Promise<{ success: boolean; count: number }> {
    try {
      // Solo sincronizar si estamos online
      if (!navigator.onLine) {
        return {
          success: false,
          count: 0,
        }
      }

      // Obtener órdenes recientes del servidor
      // Implementar esta función en lib/orders.ts
      // const orders = await getRecentOrders()
      // await indexedDBService.saveAllOrders(orders)

      // Por ahora, simular éxito
      return {
        success: true,
        count: 0,
      }
    } catch (error) {
      console.error("Error sincronizando órdenes desde el servidor:", error)
      return {
        success: false,
        count: 0,
      }
    }
  },

  // Marcar como inicializado
  async markInitialized(minimal = false): Promise<void> {
    try {
      console.log("Marcando como inicializado, modo mínimo:", minimal)
      await indexedDBService.saveSetting("lastSyncFromServer", Date.now())
      await indexedDBService.saveSetting("offlineInitialized", true)
      await indexedDBService.saveSetting("minimalOfflineMode", minimal)
    } catch (error) {
      console.error("Error al marcar como inicializado:", error)
      throw error
    }
  },

  // Verificar si está inicializado
  async isInitialized(): Promise<boolean> {
    try {
      const initialized = await indexedDBService.getSetting("offlineInitialized")
      return initialized === true
    } catch (error) {
      console.error("Error al verificar inicialización:", error)
      return false
    }
  },

  // Sincronizar datos del servidor a IndexedDB
  async syncFromServer(): Promise<{ success: boolean; message: string }> {
    try {
      // Solo sincronizar si estamos online
      if (!navigator.onLine) {
        return {
          success: false,
          message: "No hay conexión a Internet",
        }
      }

      // 1. Sincronizar productos
      const productsResult = await this.syncProductsFromServer()

      // 2. Sincronizar clientes
      const customersResult = await this.syncCustomersFromServer()

      // 3. Sincronizar órdenes recientes
      const ordersResult = await this.syncOrdersFromServer()

      // 4. Guardar timestamp de última sincronización
      await indexedDBService.saveSetting("lastSyncFromServer", Date.now())

      const totalCount = productsResult.count + customersResult.count + ordersResult.count

      return {
        success: productsResult.success && customersResult.success,
        message: `Datos actualizados desde el servidor (${totalCount} registros)`,
      }
    } catch (error) {
      console.error("Error sincronizando desde el servidor:", error)
      return {
        success: false,
        message: "Error al sincronizar datos desde el servidor",
      }
    }
  },

  // Sincronizar datos de IndexedDB al servidor
  async syncToServer(): Promise<{ success: boolean; message: string; syncedCount: number }> {
    try {
      // Solo sincronizar si estamos online
      if (!navigator.onLine) {
        return {
          success: false,
          message: "No hay conexión a Internet",
          syncedCount: 0,
        }
      }

      // Obtener cola de sincronización
      const syncQueue = await indexedDBService.getSyncQueue()

      if (syncQueue.length === 0) {
        return {
          success: true,
          message: "No hay cambios pendientes para sincronizar",
          syncedCount: 0,
        }
      }

      let syncedCount = 0
      let errors = 0

      // Ordenar por timestamp para procesar en orden
      const sortedQueue = syncQueue.sort((a, b) => a.timestamp - b.timestamp)

      // Procesar cada elemento de la cola
      for (const item of sortedQueue) {
        try {
          let success = false

          // Procesar según el tipo de entidad y acción
          switch (item.entityType) {
            case "order":
              success = await this.syncOrderItem(item)
              break
            case "product":
              success = await this.syncProductItem(item)
              break
            case "customer":
              success = await this.syncCustomerItem(item)
              break
          }

          if (success) {
            // Eliminar de la cola si se sincronizó correctamente
            await indexedDBService.removeSyncQueueItem(item.id)
            syncedCount++
          } else {
            // Registrar error
            await indexedDBService.updateSyncQueueItemError(item.id, "Error al sincronizar con el servidor")
            errors++
          }
        } catch (error) {
          console.error(`Error sincronizando item ${item.id}:`, error)
          await indexedDBService.updateSyncQueueItemError(
            item.id,
            error instanceof Error ? error.message : "Error desconocido",
          )
          errors++
        }
      }

      // Guardar timestamp de última sincronización
      await indexedDBService.saveSetting("lastSyncToServer", Date.now())

      return {
        success: errors === 0,
        message: `Sincronización completada: ${syncedCount} elementos sincronizados${errors > 0 ? `, ${errors} errores` : ""}`,
        syncedCount,
      }
    } catch (error) {
      console.error("Error sincronizando al servidor:", error)
      return {
        success: false,
        message: "Error al sincronizar datos al servidor",
        syncedCount: 0,
      }
    }
  },

  // Sincronizar un elemento de orden
  async syncOrderItem(item: any): Promise<boolean> {
    switch (item.action) {
      case "create":
        const createResult = await createOrder(item.data)
        if (createResult.success && createResult.orderId) {
          // Si el ID local es diferente del ID del servidor, actualizar referencias
          if (item.data.id !== createResult.orderId) {
            // Actualizar el ID en IndexedDB
            const localOrder = await indexedDBService.getOrderById(item.data.id)
            if (localOrder) {
              await indexedDBService.deleteOrder(item.data.id)
              localOrder.id = createResult.orderId
              localOrder.syncStatus = "synced"
              localOrder.isLocalOnly = false
              await indexedDBService.saveOrder(localOrder)
            }
          }
        }
        return createResult.success

      case "update":
        const updateResult = await updateOrder(item.data.id.toString(), item.data)
        if (updateResult.success) {
          // Actualizar estado en IndexedDB
          const localOrder = await indexedDBService.getOrderById(item.data.id)
          if (localOrder) {
            localOrder.syncStatus = "synced"
            await indexedDBService.saveOrder(localOrder)
          }
        }
        return updateResult.success

      case "delete":
        const deleteResult = await deleteOrder(item.data.id.toString())
        if (deleteResult.success) {
          // Eliminar de IndexedDB
          await indexedDBService.deleteOrder(item.data.id)
        }
        return deleteResult.success

      default:
        return false
    }
  },

  // Sincronizar un elemento de producto
  async syncProductItem(item: any): Promise<boolean> {
    switch (item.action) {
      case "create":
        const createResult = await createProduct(item.data)
        if (createResult) {
          // Actualizar estado en IndexedDB
          const localProduct = await indexedDBService.getProductById(item.data.id)
          if (localProduct) {
            localProduct.syncStatus = "synced"
            localProduct.isLocalOnly = false
            await indexedDBService.saveProduct(localProduct)
          }
        }
        return createResult

      case "update":
        const updateResult = await updateProduct(item.data.id, item.data)
        if (updateResult) {
          // Actualizar estado en IndexedDB
          const localProduct = await indexedDBService.getProductById(item.data.id)
          if (localProduct) {
            localProduct.syncStatus = "synced"
            await indexedDBService.saveProduct(localProduct)
          }
        }
        return updateResult

      case "delete":
        const deleteResult = await deleteProduct(item.data.id)
        if (deleteResult) {
          // Eliminar de IndexedDB
          await indexedDBService.deleteProduct(item.data.id)
        }
        return deleteResult

      default:
        return false
    }
  },

  // Sincronizar un elemento de cliente
  async syncCustomerItem(item: any): Promise<boolean> {
    switch (item.action) {
      case "create":
        // Para clientes creados localmente con ID negativo
        const isLocalId = item.data.id < 0

        const createResult = await createCustomer(item.data)
        if (createResult.success && createResult.customer) {
          if (isLocalId) {
            // Si tenía ID local (negativo), actualizar referencias
            const localCustomer = await indexedDBService.getCustomerById(item.data.id)
            if (localCustomer) {
              // Eliminar el cliente con ID local
              await indexedDBService.deleteCustomer(item.data.id)

              // Guardar con el nuevo ID del servidor
              createResult.customer.syncStatus = "synced"
              createResult.customer.isLocalOnly = false
              await indexedDBService.saveCustomer(createResult.customer)

              // Actualizar órdenes que referencian este cliente
              const allOrders = await indexedDBService.getAllOrders()
              for (const order of allOrders) {
                if (order.customer_id === item.data.id) {
                  order.customer_id = createResult.customer.id
                  await indexedDBService.saveOrder(order)
                }
              }
            }
          } else {
            // Si ya tenía ID del servidor, solo actualizar estado
            const localCustomer = await indexedDBService.getCustomerById(item.data.id)
            if (localCustomer) {
              localCustomer.syncStatus = "synced"
              localCustomer.isLocalOnly = false
              await indexedDBService.saveCustomer(localCustomer)
            }
          }
        }
        return createResult.success

      case "update":
        const updateResult = await updateClient(item.data.id, item.data)
        if (updateResult) {
          // Actualizar estado en IndexedDB
          const localCustomer = await indexedDBService.getCustomerById(item.data.id)
          if (localCustomer) {
            localCustomer.syncStatus = "synced"
            await indexedDBService.saveCustomer(localCustomer)
          }
        }
        return updateResult

      case "delete":
        const deleteResult = await deleteClient(item.data.id)
        if (deleteResult.success) {
          // Eliminar de IndexedDB
          await indexedDBService.deleteCustomer(item.data.id)
        }
        return deleteResult.success

      default:
        return false
    }
  },

  // Sincronización bidireccional completa
  async syncAll(): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Primero sincronizar cambios locales al servidor
      const toServerResult = await this.syncToServer()

      // 2. Luego obtener datos actualizados del servidor
      const fromServerResult = await this.syncFromServer()

      // Determinar resultado general
      const success = toServerResult.success && fromServerResult.success
      let message = ""

      if (toServerResult.syncedCount > 0) {
        message += `${toServerResult.syncedCount} cambios enviados al servidor. `
      }

      message += fromServerResult.message

      return { success, message }
    } catch (error) {
      console.error("Error en sincronización completa:", error)
      return {
        success: false,
        message: "Error durante la sincronización: " + (error instanceof Error ? error.message : "Error desconocido"),
      }
    }
  },

  // Obtener información de última sincronización
  async getLastSyncInfo(): Promise<{ fromServer: number | null; toServer: number | null }> {
    const fromServer = await indexedDBService.getSetting("lastSyncFromServer")
    const toServer = await indexedDBService.getSetting("lastSyncToServer")

    return { fromServer, toServer }
  },

  // Verificar si hay cambios pendientes
  async hasPendingChanges(): Promise<boolean> {
    const count = await indexedDBService.getPendingSyncCount()
    return count > 0
  },
}

