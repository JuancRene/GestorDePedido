"use client"

import { openDB, type DBSchema, type IDBPDatabase } from "idb"
import type { Order, Product, Customer } from "@/types/order"

// Definición del esquema de la base de datos
interface LaPecosaDB extends DBSchema {
  orders: {
    key: string
    value: Order & {
      localId?: string
      syncStatus?: "pending" | "synced" | "error"
      isLocalOnly?: boolean
      lastModified: number
    }
    indexes: {
      "by-timestamp": string
      "by-status": string
      "by-sync-status": string
    }
  }
  products: {
    key: number
    value: Product & {
      syncStatus?: "pending" | "synced" | "error"
      isLocalOnly?: boolean
      lastModified: number
    }
    indexes: {
      "by-category": string
      "by-sync-status": string
    }
  }
  customers: {
    key: number
    value: Customer & {
      syncStatus?: "pending" | "synced" | "error"
      isLocalOnly?: boolean
      lastModified: number
    }
    indexes: {
      "by-name": string
      "by-sync-status": string
    }
  }
  syncQueue: {
    key: string
    value: {
      id: string
      entityType: "order" | "product" | "customer"
      action: "create" | "update" | "delete"
      entityId: number | string
      data: any
      timestamp: number
      retryCount: number
      error?: string
    }
    indexes: {
      "by-timestamp": number
      "by-entity-type": string
    }
  }
  settings: {
    key: string
    value: any
  }
}

const DB_NAME = "la-pecosa-offline-db"
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<LaPecosaDB>> | null = null

const getDB = async () => {
  if (!dbPromise) {
    console.log("[IndexedDB] Inicializando base de datos", DB_NAME, DB_VERSION)

    dbPromise = openDB<LaPecosaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        console.log("[IndexedDB] Actualizando esquema de base de datos a versión", DB_VERSION)

        // Crear store de órdenes
        if (!db.objectStoreNames.contains("orders")) {
          console.log("[IndexedDB] Creando almacén de órdenes")
          const orderStore = db.createObjectStore("orders", {
            keyPath: "id",
          })
          orderStore.createIndex("by-timestamp", "created_at")
          orderStore.createIndex("by-status", "status")
          orderStore.createIndex("by-sync-status", "syncStatus")
        }

        // Crear store de productos
        if (!db.objectStoreNames.contains("products")) {
          console.log("[IndexedDB] Creando almacén de productos")
          const productStore = db.createObjectStore("products", {
            keyPath: "id",
          })
          productStore.createIndex("by-category", "category")
          productStore.createIndex("by-sync-status", "syncStatus")
        }

        // Crear store de clientes
        if (!db.objectStoreNames.contains("customers")) {
          console.log("[IndexedDB] Creando almacén de clientes")
          const customerStore = db.createObjectStore("customers", {
            keyPath: "id",
          })
          customerStore.createIndex("by-name", "name")
          customerStore.createIndex("by-sync-status", "syncStatus")
        }

        // Crear store de cola de sincronización
        if (!db.objectStoreNames.contains("syncQueue")) {
          console.log("[IndexedDB] Creando almacén de cola de sincronización")
          const syncStore = db.createObjectStore("syncQueue", {
            keyPath: "id",
          })
          syncStore.createIndex("by-timestamp", "timestamp")
          syncStore.createIndex("by-entity-type", "entityType")
        }

        // Crear store de configuración
        if (!db.objectStoreNames.contains("settings")) {
          console.log("[IndexedDB] Creando almacén de configuración")
          db.createObjectStore("settings", {
            keyPath: "key",
          })
        }

        console.log("[IndexedDB] Actualización de esquema completada")
      },
    })
  }
  return dbPromise
}

// Generar ID local único
const generateLocalId = (prefix: string) => {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`
}

export const indexedDBService = {
  // ===== ÓRDENES =====
  async saveOrder(order: Order): Promise<string> {
    console.log("[IndexedDB] Guardando orden", order.id)
    try {
      const db = await getDB()

      // Si no tiene ID, generar uno local
      if (!order.id) {
        order.id = generateLocalId("order")
        console.log("[IndexedDB] Generado ID local para orden", order.id)
      }

      const orderToSave = {
        ...order,
        syncStatus: "pending" as const,
        isLocalOnly: !navigator.onLine,
        lastModified: Date.now(),
      }

      await db.put("orders", orderToSave)
      console.log("[IndexedDB] Orden guardada correctamente", order.id)

      // Agregar a la cola de sincronización si estamos offline
      if (!navigator.onLine) {
        console.log("[IndexedDB] Añadiendo orden a cola de sincronización (offline)", order.id)
        await this.addToSyncQueue({
          entityType: "order",
          action: "create",
          entityId: order.id,
          data: order,
        })
      }

      return order.id.toString()
    } catch (error) {
      console.error("[IndexedDB] Error al guardar orden:", error)
      throw error
    }
  },

  async getOrderById(id: string): Promise<Order | null> {
    console.log("[IndexedDB] Obteniendo orden por ID", id)
    try {
      const db = await getDB()
      const order = await db.get("orders", id)
      console.log("[IndexedDB] Orden encontrada:", order ? "Sí" : "No")
      return order
    } catch (error) {
      console.error("[IndexedDB] Error al obtener orden por ID:", error)
      return null
    }
  },

  async getAllOrders(): Promise<Order[]> {
    console.log("[IndexedDB] Obteniendo todas las órdenes")
    try {
      const db = await getDB()
      const orders = await db.getAll("orders")
      console.log("[IndexedDB] Órdenes obtenidas:", orders.length)
      return orders
    } catch (error) {
      console.error("[IndexedDB] Error al obtener todas las órdenes:", error)
      return []
    }
  },

  async getOrdersByStatus(status: string): Promise<Order[]> {
    console.log("[IndexedDB] Obteniendo órdenes por estado", status)
    try {
      const db = await getDB()
      const orders = await db.getAllFromIndex("orders", "by-status", status)
      console.log("[IndexedDB] Órdenes obtenidas por estado:", orders.length)
      return orders
    } catch (error) {
      console.error("[IndexedDB] Error al obtener órdenes por estado:", error)

      // Intento alternativo si falla el índice
      try {
        console.log("[IndexedDB] Intentando método alternativo para obtener órdenes por estado")
        const allOrders = await this.getAllOrders()
        return allOrders.filter((order) => order.status === status)
      } catch (fallbackError) {
        console.error("[IndexedDB] Error en método alternativo:", fallbackError)
        return []
      }
    }
  },

  async updateOrder(id: string, orderData: Partial<Order>): Promise<boolean> {
    console.log("[IndexedDB] Actualizando orden", id)
    try {
      const db = await getDB()

      // Obtener la orden actual
      const existingOrder = await db.get("orders", id)
      if (!existingOrder) {
        console.log("[IndexedDB] Orden no encontrada para actualizar", id)
        return false
      }

      // Actualizar con los nuevos datos
      const updatedOrder = {
        ...existingOrder,
        ...orderData,
        syncStatus: "pending" as const,
        lastModified: Date.now(),
      }

      await db.put("orders", updatedOrder)
      console.log("[IndexedDB] Orden actualizada correctamente", id)

      // Agregar a la cola de sincronización si estamos offline
      if (!navigator.onLine) {
        console.log("[IndexedDB] Añadiendo actualización de orden a cola de sincronización (offline)", id)
        await this.addToSyncQueue({
          entityType: "order",
          action: "update",
          entityId: id,
          data: updatedOrder,
        })
      }

      return true
    } catch (error) {
      console.error("[IndexedDB] Error al actualizar orden:", error)
      return false
    }
  },

  async deleteOrder(id: string): Promise<boolean> {
    console.log("[IndexedDB] Eliminando orden", id)
    try {
      const db = await getDB()

      // Verificar si existe
      const existingOrder = await db.get("orders", id)
      if (!existingOrder) {
        console.log("[IndexedDB] Orden no encontrada para eliminar", id)
        return false
      }

      // Si es un registro local que nunca se ha sincronizado, eliminarlo directamente
      if (existingOrder.isLocalOnly) {
        console.log("[IndexedDB] Eliminando orden local directamente", id)
        await db.delete("orders", id)

        // También eliminar de la cola de sincronización si existe
        const syncItems = await db.getAllFromIndex("syncQueue", "by-entity-type", "order")
        for (const item of syncItems) {
          if (item.entityId === id) {
            console.log("[IndexedDB] Eliminando orden de la cola de sincronización", id)
            await db.delete("syncQueue", item.id)
          }
        }
      } else {
        // Si ya existe en el servidor, marcar como pendiente de eliminación
        console.log("[IndexedDB] Marcando orden para eliminación en el servidor", id)
        existingOrder.syncStatus = "pending"
        existingOrder.lastModified = Date.now()
        await db.put("orders", existingOrder)

        // Agregar a la cola de sincronización
        await this.addToSyncQueue({
          entityType: "order",
          action: "delete",
          entityId: id,
          data: { id },
        })
      }

      return true
    } catch (error) {
      console.error("[IndexedDB] Error al eliminar orden:", error)
      return false
    }
  },

  // ===== PRODUCTOS =====
  async saveProduct(product: Product): Promise<number> {
    console.log("[IndexedDB] Guardando producto", product.id)
    try {
      const db = await getDB()

      const productToSave = {
        ...product,
        syncStatus: "pending" as const,
        isLocalOnly: !navigator.onLine,
        lastModified: Date.now(),
        category: product.category || "Sin categoría",
      }

      await db.put("products", productToSave)
      console.log("[IndexedDB] Producto guardado correctamente", product.id)

      // Agregar a la cola de sincronización si estamos offline
      if (!navigator.onLine) {
        console.log("[IndexedDB] Añadiendo producto a cola de sincronización (offline)", product.id)
        await this.addToSyncQueue({
          entityType: "product",
          action: "create",
          entityId: product.id,
          data: product,
        })
      }

      return product.id
    } catch (error) {
      console.error("[IndexedDB] Error al guardar producto:", error)
      throw error
    }
  },

  async saveAllProducts(products: Product[]): Promise<void> {
    console.log("[IndexedDB] Guardando todos los productos", products.length)
    try {
      const db = await getDB()
      const tx = db.transaction("products", "readwrite")

      // Marcar todos como sincronizados
      const productsToSave = products.map((product) => ({
        ...product,
        syncStatus: "synced" as const,
        lastModified: Date.now(),
        category: product.category || "Sin categoría",
      }))

      await Promise.all([...productsToSave.map((product) => tx.store.put(product)), tx.done])
      console.log("[IndexedDB] Todos los productos guardados correctamente")
    } catch (error) {
      console.error("[IndexedDB] Error al guardar todos los productos:", error)
      throw error
    }
  },

  async getProductById(id: number): Promise<Product | null> {
    console.log("[IndexedDB] Obteniendo producto por ID", id)
    try {
      const db = await getDB()
      const product = await db.get("products", id)
      console.log("[IndexedDB] Producto encontrado:", product ? "Sí" : "No")
      return product
    } catch (error) {
      console.error("[IndexedDB] Error al obtener producto por ID:", error)
      return null
    }
  },

  async getAllProducts(): Promise<Product[]> {
    console.log("[IndexedDB] Obteniendo todos los productos")
    try {
      const db = await getDB()
      const products = await db.getAll("products")
      console.log("[IndexedDB] Productos obtenidos:", products.length)
      return products.map((p) => ({
        ...p,
        category: p.category || "Sin categoría",
      }))
    } catch (error) {
      console.error("[IndexedDB] Error al obtener todos los productos:", error)
      return []
    }
  },

  async getProductsByCategory(category: string): Promise<Product[]> {
    console.log("[IndexedDB] Obteniendo productos por categoría", category)
    try {
      const db = await getDB()
      const products = await db.getAllFromIndex("products", "by-category", category)
      console.log("[IndexedDB] Productos obtenidos por categoría:", products.length)
      return products
    } catch (error) {
      console.error("[IndexedDB] Error al obtener productos por categoría:", error)

      // Intento alternativo si falla el índice
      try {
        console.log("[IndexedDB] Intentando método alternativo para obtener productos por categoría")
        const allProducts = await this.getAllProducts()
        return allProducts.filter((product) => product.category === category)
      } catch (fallbackError) {
        console.error("[IndexedDB] Error en método alternativo:", fallbackError)
        return []
      }
    }
  },

  async updateProduct(id: number, productData: Partial<Product>): Promise<boolean> {
    console.log("[IndexedDB] Actualizando producto", id)
    try {
      const db = await getDB()

      // Obtener el producto actual
      const existingProduct = await db.get("products", id)
      if (!existingProduct) {
        console.log("[IndexedDB] Producto no encontrado para actualizar", id)
        return false
      }

      // Actualizar con los nuevos datos
      const updatedProduct = {
        ...existingProduct,
        ...productData,
        syncStatus: "pending" as const,
        lastModified: Date.now(),
      }

      await db.put("products", updatedProduct)
      console.log("[IndexedDB] Producto actualizado correctamente", id)

      // Agregar a la cola de sincronización si estamos offline
      if (!navigator.onLine) {
        console.log("[IndexedDB] Añadiendo actualización de producto a cola de sincronización (offline)", id)
        await this.addToSyncQueue({
          entityType: "product",
          action: "update",
          entityId: id,
          data: updatedProduct,
        })
      }

      return true
    } catch (error) {
      console.error("[IndexedDB] Error al actualizar producto:", error)
      return false
    }
  },

  async deleteProduct(id: number): Promise<boolean> {
    console.log("[IndexedDB] Eliminando producto", id)
    try {
      const db = await getDB()

      // Verificar si existe
      const existingProduct = await db.get("products", id)
      if (!existingProduct) {
        console.log("[IndexedDB] Producto no encontrado para eliminar", id)
        return false
      }

      // Si es un registro local que nunca se ha sincronizado, eliminarlo directamente
      if (existingProduct.isLocalOnly) {
        console.log("[IndexedDB] Eliminando producto local directamente", id)
        await db.delete("products", id)

        // También eliminar de la cola de sincronización si existe
        const syncItems = await db.getAllFromIndex("syncQueue", "by-entity-type", "product")
        for (const item of syncItems) {
          if (item.entityId === id) {
            console.log("[IndexedDB] Eliminando producto de la cola de sincronización", id)
            await db.delete("syncQueue", item.id)
          }
        }
      } else {
        // Si ya existe en el servidor, marcar como pendiente de eliminación
        console.log("[IndexedDB] Marcando producto para eliminación en el servidor", id)
        existingProduct.syncStatus = "pending"
        existingProduct.lastModified = Date.now()
        await db.put("products", existingProduct)

        // Agregar a la cola de sincronización
        await this.addToSyncQueue({
          entityType: "product",
          action: "delete",
          entityId: id,
          data: { id },
        })
      }

      return true
    } catch (error) {
      console.error("[IndexedDB] Error al eliminar producto:", error)
      return false
    }
  },

  // ===== CLIENTES =====
  async saveCustomer(customer: Customer): Promise<number> {
    console.log("[IndexedDB] Guardando cliente", customer.id)
    try {
      const db = await getDB()

      // Si no tiene ID, generar uno temporal negativo
      if (!customer.id) {
        // IDs negativos para clientes locales
        const lowestId = await this.getLowestCustomerId()
        customer.id = lowestId - 1
        console.log("[IndexedDB] Generado ID local para cliente", customer.id)
      }

      const customerToSave = {
        ...customer,
        syncStatus: "pending" as const,
        isLocalOnly: !navigator.onLine,
        lastModified: Date.now(),
      }

      await db.put("customers", customerToSave)
      console.log("[IndexedDB] Cliente guardado correctamente", customer.id)

      // Agregar a la cola de sincronización si estamos offline
      if (!navigator.onLine) {
        console.log("[IndexedDB] Añadiendo cliente a cola de sincronización (offline)", customer.id)
        await this.addToSyncQueue({
          entityType: "customer",
          action: "create",
          entityId: customer.id,
          data: customer,
        })
      }

      return customer.id
    } catch (error) {
      console.error("[IndexedDB] Error al guardar cliente:", error)
      throw error
    }
  },

  async getLowestCustomerId(): Promise<number> {
    console.log("[IndexedDB] Obteniendo ID más bajo de cliente")
    try {
      const db = await getDB()
      const customers = await db.getAll("customers")

      if (customers.length === 0) return -1

      // Encontrar el ID más bajo (negativo)
      const lowestId = customers.reduce((lowest, customer) => (customer.id < lowest ? customer.id : lowest), 0)
      console.log("[IndexedDB] ID más bajo de cliente encontrado:", lowestId)
      return lowestId
    } catch (error) {
      console.error("[IndexedDB] Error al obtener ID más bajo de cliente:", error)
      return -1
    }
  },

  async saveAllCustomers(customers: Customer[]): Promise<void> {
    console.log("[IndexedDB] Guardando todos los clientes", customers.length)
    try {
      const db = await getDB()
      const tx = db.transaction("customers", "readwrite")

      // Marcar todos como sincronizados
      const customersToSave = customers.map((customer) => ({
        ...customer,
        syncStatus: "synced" as const,
        lastModified: Date.now(),
      }))

      await Promise.all([...customersToSave.map((customer) => tx.store.put(customer)), tx.done])
      console.log("[IndexedDB] Todos los clientes guardados correctamente")
    } catch (error) {
      console.error("[IndexedDB] Error al guardar todos los clientes:", error)
      throw error
    }
  },

  async getCustomerById(id: number): Promise<Customer | null> {
    console.log("[IndexedDB] Obteniendo cliente por ID", id)
    try {
      const db = await getDB()
      const customer = await db.get("customers", id)
      console.log("[IndexedDB] Cliente encontrado:", customer ? "Sí" : "No")
      return customer
    } catch (error) {
      console.error("[IndexedDB] Error al obtener cliente por ID:", error)
      return null
    }
  },

  async getAllCustomers(): Promise<Customer[]> {
    console.log("[IndexedDB] Obteniendo todos los clientes")
    try {
      const db = await getDB()
      const customers = await db.getAll("customers")
      console.log("[IndexedDB] Clientes obtenidos:", customers.length)
      return customers
    } catch (error) {
      console.error("[IndexedDB] Error al obtener todos los clientes:", error)
      return []
    }
  },

  async searchCustomers(query: string): Promise<Customer[]> {
    console.log("[IndexedDB] Buscando clientes con consulta", query)
    try {
      const db = await getDB()
      const allCustomers = await db.getAll("customers")

      // Búsqueda local
      const filteredCustomers = allCustomers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(query.toLowerCase()) ||
          (customer.phone && customer.phone.includes(query)) ||
          (customer.address && customer.address.toLowerCase().includes(query.toLowerCase())),
      )

      console.log("[IndexedDB] Clientes encontrados:", filteredCustomers.length)
      return filteredCustomers
    } catch (error) {
      console.error("[IndexedDB] Error al buscar clientes:", error)
      return []
    }
  },

  async updateCustomer(id: number, customerData: Partial<Customer>): Promise<boolean> {
    console.log("[IndexedDB] Actualizando cliente", id)
    try {
      const db = await getDB()

      // Obtener el cliente actual
      const existingCustomer = await db.get("customers", id)
      if (!existingCustomer) {
        console.log("[IndexedDB] Cliente no encontrado para actualizar", id)
        return false
      }

      // Actualizar con los nuevos datos
      const updatedCustomer = {
        ...existingCustomer,
        ...customerData,
        syncStatus: "pending" as const,
        lastModified: Date.now(),
      }

      await db.put("customers", updatedCustomer)
      console.log("[IndexedDB] Cliente actualizado correctamente", id)

      // Agregar a la cola de sincronización si estamos offline
      if (!navigator.onLine) {
        console.log("[IndexedDB] Añadiendo actualización de cliente a cola de sincronización (offline)", id)
        await this.addToSyncQueue({
          entityType: "customer",
          action: "update",
          entityId: id,
          data: updatedCustomer,
        })
      }

      return true
    } catch (error) {
      console.error("[IndexedDB] Error al actualizar cliente:", error)
      return false
    }
  },

  async deleteCustomer(id: number): Promise<boolean> {
    console.log("[IndexedDB] Eliminando cliente", id)
    try {
      const db = await getDB()

      // Verificar si existe
      const existingCustomer = await db.get("customers", id)
      if (!existingCustomer) {
        console.log("[IndexedDB] Cliente no encontrado para eliminar", id)
        return false
      }

      // Si es un registro local que nunca se ha sincronizado, eliminarlo directamente
      if (existingCustomer.isLocalOnly) {
        console.log("[IndexedDB] Eliminando cliente local directamente", id)
        await db.delete("customers", id)

        // También eliminar de la cola de sincronización si existe
        const syncItems = await db.getAllFromIndex("syncQueue", "by-entity-type", "customer")
        for (const item of syncItems) {
          if (item.entityId === id) {
            console.log("[IndexedDB] Eliminando cliente de la cola de sincronización", id)
            await db.delete("syncQueue", item.id)
          }
        }
      } else {
        // Si ya existe en el servidor, marcar como pendiente de eliminación
        console.log("[IndexedDB] Marcando cliente para eliminación en el servidor", id)
        existingCustomer.syncStatus = "pending"
        existingCustomer.lastModified = Date.now()
        await db.put("customers", existingCustomer)

        // Agregar a la cola de sincronización
        await this.addToSyncQueue({
          entityType: "customer",
          action: "delete",
          entityId: id,
          data: { id },
        })
      }

      return true
    } catch (error) {
      console.error("[IndexedDB] Error al eliminar cliente:", error)
      return false
    }
  },

  // ===== COLA DE SINCRONIZACIÓN =====
  async addToSyncQueue({
    entityType,
    action,
    entityId,
    data,
  }: {
    entityType: "order" | "product" | "customer"
    action: "create" | "update" | "delete"
    entityId: number | string
    data: any
  }): Promise<string> {
    console.log("[IndexedDB] Añadiendo a cola de sincronización", { entityType, action, entityId })
    try {
      const db = await getDB()

      const id = generateLocalId(`sync_${entityType}_${action}`)

      await db.add("syncQueue", {
        id,
        entityType,
        action,
        entityId,
        data,
        timestamp: Date.now(),
        retryCount: 0,
      })

      console.log("[IndexedDB] Añadido a cola de sincronización correctamente", id)
      return id
    } catch (error) {
      console.error("[IndexedDB] Error al añadir a cola de sincronización:", error)
      throw error
    }
  },

  async getSyncQueue(): Promise<any[]> {
    console.log("[IndexedDB] Obteniendo cola de sincronización")
    try {
      const db = await getDB()
      const queue = await db.getAllFromIndex("syncQueue", "by-timestamp")
      console.log("[IndexedDB] Cola de sincronización obtenida:", queue.length, "elementos")
      return queue
    } catch (error) {
      console.error("[IndexedDB] Error al obtener cola de sincronización:", error)

      // Intento alternativo si falla el índice
      try {
        console.log("[IndexedDB] Intentando método alternativo para obtener cola de sincronización")
        const db = await getDB()
        return db.getAll("syncQueue")
      } catch (fallbackError) {
        console.error("[IndexedDB] Error en método alternativo:", fallbackError)
        return []
      }
    }
  },

  async removeSyncQueueItem(id: string): Promise<void> {
    console.log("[IndexedDB] Eliminando elemento de cola de sincronización", id)
    try {
      const db = await getDB()
      await db.delete("syncQueue", id)
      console.log("[IndexedDB] Elemento eliminado de cola de sincronización correctamente")
    } catch (error) {
      console.error("[IndexedDB] Error al eliminar elemento de cola de sincronización:", error)
      throw error
    }
  },

  async updateSyncQueueItemError(id: string, error: string): Promise<void> {
    console.log("[IndexedDB] Actualizando error en elemento de cola de sincronización", id)
    try {
      const db = await getDB()
      const item = await db.get("syncQueue", id)

      if (item) {
        item.retryCount += 1
        item.error = error
        await db.put("syncQueue", item)
        console.log("[IndexedDB] Error actualizado en elemento de cola de sincronización", {
          retryCount: item.retryCount,
        })
      } else {
        console.log("[IndexedDB] Elemento no encontrado en cola de sincronización", id)
      }
    } catch (error) {
      console.error("[IndexedDB] Error al actualizar error en elemento de cola de sincronización:", error)
      throw error
    }
  },

  // ===== CONFIGURACIÓN =====
  async saveSetting(key: string, value: any): Promise<void> {
    console.log("[IndexedDB] Guardando configuración", key)
    try {
      const db = await getDB()
      await db.put("settings", { key, value })
      console.log("[IndexedDB] Configuración guardada correctamente", key)
    } catch (error) {
      console.error("[IndexedDB] Error al guardar configuración:", error)
      throw error
    }
  },

  async getSetting(key: string): Promise<any> {
    console.log("[IndexedDB] Obteniendo configuración", key)
    try {
      const db = await getDB()
      const setting = await db.get("settings", key)
      console.log("[IndexedDB] Configuración obtenida:", key, setting ? "Encontrada" : "No encontrada")
      return setting ? setting.value : null
    } catch (error) {
      console.error("[IndexedDB] Error al obtener configuración:", error)
      return null
    }
  },

  // ===== UTILIDADES =====
  async getPendingSyncCount(): Promise<number> {
    console.log("[IndexedDB] Obteniendo cantidad de elementos pendientes de sincronización")
    try {
      const db = await getDB()
      const queue = await db.getAll("syncQueue")
      console.log("[IndexedDB] Cantidad de elementos pendientes de sincronización:", queue.length)
      return queue.length
    } catch (error) {
      console.error("[IndexedDB] Error al obtener cantidad de elementos pendientes de sincronización:", error)
      return 0
    }
  },

  async clearAllData(): Promise<void> {
    console.log("[IndexedDB] Limpiando todos los datos")
    try {
      const db = await getDB()
      await Promise.all([
        db.clear("orders"),
        db.clear("products"),
        db.clear("customers"),
        db.clear("syncQueue"),
        db.clear("settings"),
      ])
      console.log("[IndexedDB] Todos los datos limpiados correctamente")
    } catch (error) {
      console.error("[IndexedDB] Error al limpiar todos los datos:", error)
      throw error
    }
  },
}

