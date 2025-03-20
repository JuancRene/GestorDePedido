import { createClient } from "@/lib/supabase"

// Tipos
export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  createdAt: string
}

// Servicio de base de datos
export const dbService = {
  // Categorías
  async getCategories(): Promise<Category[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("categories").select("*").order("name")

    if (error) {
      console.error("Error fetching categories:", error)
      return []
    }

    return data || []
  },

  async addCategory(name: string): Promise<Category | null> {
    const supabase = createClient()
    const newCategory = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("categories").insert(newCategory).select().single()

    if (error) {
      console.error("Error adding category:", error)
      return null
    }

    return data
  },

  async deleteCategory(id: string): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error) {
      console.error("Error deleting category:", error)
      return false
    }

    return true
  },

  // Productos
  async getProducts(): Promise<Product[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("products").select("*").order("name")

    if (error) {
      console.error("Error fetching products:", error)
      return []
    }

    return data || []
  },

  async getProductById(id: string): Promise<Product | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching product:", error)
      return null
    }

    return data
  },

  async addProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product | null> {
    const supabase = createClient()
    const newProduct = {
      id: crypto.randomUUID(),
      ...product,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("products").insert(newProduct).select().single()

    if (error) {
      console.error("Error adding product:", error)
      return null
    }

    return data
  },

  async updateProduct(id: string, product: Partial<Omit<Product, "id" | "createdAt">>): Promise<Product | null> {
    const supabase = createClient()
    const updatedProduct = {
      ...product,
      updatedAt: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("products").update(updatedProduct).eq("id", id).select().single()

    if (error) {
      console.error("Error updating product:", error)
      return null
    }

    return data
  },

  async deleteProduct(id: string): Promise<boolean> {
    const supabase = createClient()
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      console.error("Error deleting product:", error)
      return false
    }

    return true
  },

  // Autenticación
  async signIn(email: string, password: string): Promise<{ user: any; session: any } | null> {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Error signing in:", error)
      return null
    }

    return data
  },

  async signOut(): Promise<void> {
    const supabase = createClient()
    await supabase.auth.signOut()
  },
}

