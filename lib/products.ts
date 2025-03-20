import { createClient } from "@/lib/supabase"
import { storage } from "@/lib/storage"

// Interfaces
export interface Product {
  id: number
  name: string
  price: number
  category: string
  ingredients: string[]
  format_sales?: string
  createdAt?: string
  updatedAt?: string
}

// Función para obtener todas las categorías
export async function getCategories(): Promise<string[]> {
  try {
    // Primero intentamos obtener las categorías de Supabase
    const supabase = createClient()
    const { data, error } = await supabase.from("categories").select("name").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching categories from Supabase:", error)
      throw error
    }

    // Si tenemos datos, devolvemos los nombres de las categorías
    if (data && data.length > 0) {
      return data.map((category) => category.name)
    }

    // Si no hay datos en Supabase, intentamos obtenerlos del almacenamiento local
    const localCategories = storage.getItem("product-categories")
    if (localCategories) {
      try {
        return JSON.parse(localCategories)
      } catch (e) {
        console.error("Error parsing local categories:", e)
      }
    }

    // Si no hay categorías en ninguna parte, devolvemos categorías predeterminadas
    return ["Plato principal", "Entrada", "Postre", "Bebida"]
  } catch (error) {
    console.error("Error in getCategories:", error)

    // En caso de error, intentamos obtener las categorías del almacenamiento local
    const localCategories = storage.getItem("product-categories")
    if (localCategories) {
      try {
        return JSON.parse(localCategories)
      } catch (e) {
        console.error("Error parsing local categories:", e)
      }
    }

    // Si todo falla, devolvemos categorías predeterminadas
    return ["Plato principal", "Entrada", "Postre", "Bebida"]
  }
}

// Función para guardar una nueva categoría
export async function saveCategory(categoryName: string): Promise<boolean> {
  try {
    const supabase = createClient()
    // Primero verificamos si la categoría ya existe
    const { data: existingCategories, error: fetchError } = await supabase
      .from("categories")
      .select("name")
      .eq("name", categoryName)

    if (fetchError) {
      console.error("Error checking if category exists:", fetchError)
      throw fetchError
    }

    // Si la categoría ya existe, no hacemos nada y devolvemos true
    if (existingCategories && existingCategories.length > 0) {
      return true
    }

    // Si la categoría no existe, la insertamos
    const { error } = await supabase.from("categories").insert([{ name: categoryName }])

    if (error) {
      console.error("Error saving category to Supabase:", error)
      throw error
    }

    // También actualizamos el almacenamiento local como respaldo
    try {
      const categories = await getCategories()
      if (!categories.includes(categoryName)) {
        categories.push(categoryName)
        storage.setItem("product-categories", JSON.stringify(categories))
      }
    } catch (e) {
      console.error("Error updating local categories:", e)
    }

    return true
  } catch (error) {
    console.error("Error in saveCategory:", error)

    // En caso de error con Supabase, intentamos guardar en el almacenamiento local
    try {
      const localCategoriesStr = storage.getItem("product-categories")
      let localCategories: string[] = []

      if (localCategoriesStr) {
        localCategories = JSON.parse(localCategoriesStr)
      }

      if (!localCategories.includes(categoryName)) {
        localCategories.push(categoryName)
        storage.setItem("product-categories", JSON.stringify(localCategories))
      }

      return true
    } catch (e) {
      console.error("Error saving category locally:", e)
      return false
    }
  }
}

// Función para verificar si un ID de producto ya existe
export async function checkProductIdExists(id: string | number): Promise<boolean> {
  try {
    const supabase = createClient()
    const numericId = typeof id === "string" ? Number.parseInt(id, 10) : id

    const { data, error } = await supabase.from("products").select("id").eq("id", numericId).single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 es el código para "no se encontraron resultados"
      console.error("Error checking product ID:", error)
      throw error
    }

    return !!data
  } catch (error) {
    console.error("Error in checkProductIdExists:", error)

    // En caso de error, intentamos verificar en el almacenamiento local
    try {
      const localProductsStr = storage.getItem("products")
      if (localProductsStr) {
        const localProducts = JSON.parse(localProductsStr)
        const numericId = typeof id === "string" ? Number.parseInt(id, 10) : id
        return localProducts.some((product: Product) => product.id === numericId)
      }
    } catch (e) {
      console.error("Error checking product ID locally:", e)
    }

    return false
  }
}

// Función para crear un nuevo producto
export async function createProduct(product: Product): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from("products").insert([
      {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        ingredients: product.ingredients,
        format_sales: product.format_sales || "Por porción",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error("Error creating product in Supabase:", error)
      throw error
    }

    // También actualizamos el almacenamiento local como respaldo
    try {
      const localProductsStr = storage.getItem("products")
      let localProducts: Product[] = []

      if (localProductsStr) {
        localProducts = JSON.parse(localProductsStr)
      }

      localProducts.push({
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      storage.setItem("products", JSON.stringify(localProducts))
    } catch (e) {
      console.error("Error updating local products:", e)
    }

    return true
  } catch (error) {
    console.error("Error in createProduct:", error)

    // En caso de error con Supabase, intentamos guardar en el almacenamiento local
    try {
      const localProductsStr = storage.getItem("products")
      let localProducts: Product[] = []

      if (localProductsStr) {
        localProducts = JSON.parse(localProductsStr)
      }

      localProducts.push({
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      storage.setItem("products", JSON.stringify(localProducts))
      return true
    } catch (e) {
      console.error("Error saving product locally:", e)
      return false
    }
  }
}

// Función para actualizar un producto existente
export async function updateProduct(originalId: number, product: Product): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from("products")
      .update({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        ingredients: product.ingredients,
        format_sales: product.format_sales || "Por porción",
        updated_at: new Date().toISOString(),
      })
      .eq("id", originalId)

    if (error) {
      console.error("Error updating product in Supabase:", error)
      throw error
    }

    // También actualizamos el almacenamiento local como respaldo
    try {
      const localProductsStr = storage.getItem("products")

      if (localProductsStr) {
        const localProducts: Product[] = JSON.parse(localProductsStr)

        // Encontramos el índice del producto original
        const productIndex = localProducts.findIndex((p) => p.id === originalId)

        if (productIndex !== -1) {
          // Si el ID ha cambiado, eliminamos el producto original y añadimos uno nuevo
          if (originalId !== product.id) {
            localProducts.splice(productIndex, 1)
            localProducts.push({
              ...product,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          } else {
            // Si el ID no ha cambiado, actualizamos el producto existente
            localProducts[productIndex] = {
              ...product,
              createdAt: localProducts[productIndex].createdAt,
              updatedAt: new Date().toISOString(),
            }
          }

          storage.setItem("products", JSON.stringify(localProducts))
        }
      }
    } catch (e) {
      console.error("Error updating local products:", e)
    }

    return true
  } catch (error) {
    console.error("Error in updateProduct:", error)

    // En caso de error con Supabase, intentamos actualizar en el almacenamiento local
    try {
      const localProductsStr = storage.getItem("products")

      if (localProductsStr) {
        const localProducts: Product[] = JSON.parse(localProductsStr)

        // Encontramos el índice del producto original
        const productIndex = localProducts.findIndex((p) => p.id === originalId)

        if (productIndex !== -1) {
          // Si el ID ha cambiado, eliminamos el producto original y añadimos uno nuevo
          if (originalId !== product.id) {
            localProducts.splice(productIndex, 1)
            localProducts.push({
              ...product,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          } else {
            // Si el ID no ha cambiado, actualizamos el producto existente
            localProducts[productIndex] = {
              ...product,
              createdAt: localProducts[productIndex].createdAt,
              updatedAt: new Date().toISOString(),
            }
          }

          storage.setItem("products", JSON.stringify(localProducts))
          return true
        }
      }

      return false
    } catch (e) {
      console.error("Error updating product locally:", e)
      return false
    }
  }
}

// Función para obtener todos los productos
export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("products").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching products from Supabase:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in getProducts:", error)

    // En caso de error, intentamos obtener los productos del almacenamiento local
    try {
      const localProductsStr = storage.getItem("products")
      if (localProductsStr) {
        return JSON.parse(localProductsStr)
      }
    } catch (e) {
      console.error("Error parsing local products:", e)
    }

    return []
  }
}

// Función para eliminar un producto
export async function deleteProduct(id: number): Promise<boolean> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      console.error("Error deleting product from Supabase:", error)
      throw error
    }

    // También actualizamos el almacenamiento local como respaldo
    try {
      const localProductsStr = storage.getItem("products")

      if (localProductsStr) {
        let localProducts: Product[] = JSON.parse(localProductsStr)
        localProducts = localProducts.filter((p) => p.id !== id)
        storage.setItem("products", JSON.stringify(localProducts))
      }
    } catch (e) {
      console.error("Error updating local products after deletion:", e)
    }

    return true
  } catch (error) {
    console.error("Error in deleteProduct:", error)

    // En caso de error con Supabase, intentamos eliminar del almacenamiento local
    try {
      const localProductsStr = storage.getItem("products")

      if (localProductsStr) {
        let localProducts: Product[] = JSON.parse(localProductsStr)
        localProducts = localProducts.filter((p) => p.id !== id)
        storage.setItem("products", JSON.stringify(localProducts))
        return true
      }

      return false
    } catch (e) {
      console.error("Error deleting product locally:", e)
      return false
    }
  }
}

