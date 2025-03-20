"use client"

import { indexedDBService } from "./indexeddb-service"
import { syncService } from "./sync-service"
import type { Product } from "@/types/order"
import { toast } from "@/hooks/use-toast"

// Obtener productos con soporte offline
export async function getProductsWithOfflineSupport(): Promise<Product[]> {
  try {
    // Si estamos online, intentar sincronizar primero
    if (navigator.onLine) {
      try {
        await syncService.syncFromServer()
      } catch (error) {
        console.error("Error al sincronizar productos desde el servidor:", error)
      }
    }

    // Obtener productos de IndexedDB
    const products = await indexedDBService.getAllProducts()
    return products
  } catch (error) {
    console.error("Error al obtener productos:", error)
    toast({
      title: "Error",
      description: "No se pudieron cargar los productos",
      variant: "destructive",
    })
    return []
  }
}

// Crear producto con soporte offline
export async function createProductWithOfflineSupport(product: Omit<Product, "created_at">): Promise<{
  success: boolean
  message: string
  isOffline: boolean
}> {
  try {
    // Guardar en IndexedDB
    await indexedDBService.saveProduct(product)

    // Si estamos online, intentar sincronizar inmediatamente
    if (navigator.onLine) {
      try {
        await syncService.syncToServer()
        return {
          success: true,
          message: "Producto creado y sincronizado con el servidor",
          isOffline: false,
        }
      } catch (error) {
        console.error("Error al sincronizar producto con el servidor:", error)
        return {
          success: true,
          message: "Producto creado localmente, pero no se pudo sincronizar con el servidor",
          isOffline: true,
        }
      }
    } else {
      // Si estamos offline, informar que se guardó localmente
      return {
        success: true,
        message: "Producto guardado localmente. Se sincronizará cuando haya conexión.",
        isOffline: true,
      }
    }
  } catch (error) {
    console.error("Error al crear producto:", error)
    return {
      success: false,
      message: "Error al crear el producto: " + (error instanceof Error ? error.message : "Error desconocido"),
      isOffline: !navigator.onLine,
    }
  }
}

// Actualizar producto con soporte offline
export async function updateProductWithOfflineSupport(
  id: number,
  productData: Partial<Product>,
): Promise<{
  success: boolean
  message: string
  isOffline: boolean
}> {
  try {
    // Actualizar en IndexedDB
    const updated = await indexedDBService.updateProduct(id, productData)

    if (!updated) {
      return {
        success: false,
        message: "No se encontró el producto para actualizar",
        isOffline: !navigator.onLine,
      }
    }

    // Si estamos online, intentar sincronizar inmediatamente
    if (navigator.onLine) {
      try {
        await syncService.syncToServer()
        return {
          success: true,
          message: "Producto actualizado y sincronizado con el servidor",
          isOffline: false,
        }
      } catch (error) {
        console.error("Error al sincronizar producto con el servidor:", error)
        return {
          success: true,
          message: "Producto actualizado localmente, pero no se pudo sincronizar con el servidor",
          isOffline: true,
        }
      }
    } else {
      // Si estamos offline, informar que se guardó localmente
      return {
        success: true,
        message: "Producto actualizado localmente. Se sincronizará cuando haya conexión.",
        isOffline: true,
      }
    }
  } catch (error) {
    console.error("Error al actualizar producto:", error)
    return {
      success: false,
      message: "Error al actualizar el producto: " + (error instanceof Error ? error.message : "Error desconocido"),
      isOffline: !navigator.onLine,
    }
  }
}

// Eliminar producto con soporte offline
export async function deleteProductWithOfflineSupport(id: number): Promise<{
  success: boolean
  message: string
  isOffline: boolean
}> {
  try {
    // Eliminar de IndexedDB
    const deleted = await indexedDBService.deleteProduct(id)

    if (!deleted) {
      return {
        success: false,
        message: "No se encontró el producto para eliminar",
        isOffline: !navigator.onLine,
      }
    }

    // Si estamos online, intentar sincronizar inmediatamente
    if (navigator.onLine) {
      try {
        await syncService.syncToServer()
        return {
          success: true,
          message: "Producto eliminado y sincronizado con el servidor",
          isOffline: false,
        }
      } catch (error) {
        console.error("Error al sincronizar eliminación con el servidor:", error)
        return {
          success: true,
          message: "Producto eliminado localmente, pero no se pudo sincronizar con el servidor",
          isOffline: true,
        }
      }
    } else {
      // Si estamos offline, informar que se eliminó localmente
      return {
        success: true,
        message: "Producto eliminado localmente. Se sincronizará cuando haya conexión.",
        isOffline: true,
      }
    }
  } catch (error) {
    console.error("Error al eliminar producto:", error)
    return {
      success: false,
      message: "Error al eliminar el producto: " + (error instanceof Error ? error.message : "Error desconocido"),
      isOffline: !navigator.onLine,
    }
  }
}

