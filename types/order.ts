export interface OrderItem {
  product_id: number
  productName: string
  basePrice: number
  quantity: number
  removedIngredients: string[]
  notes: string
  format_sales?: string
  is_by_weight?: boolean
}

export interface Order {
  id: number
  customer: string
  customer_id?: number
  items: OrderItem[]
  total: number
  status: "pending" | "in-progress" | "completed" | "cancelled"
  time: string
  date: string
  payment_method?: string
  delivery_method?: string
  cash_amount?: number
  change?: number
  pickup_date_time?: string
  delivery_address?: string
  delivery_date_time?: string
  created_at: string
  employee_id?: number
  employee_name?: string
}

export interface Customer {
  id: number
  name: string
  phone: string
  address: string
  notes?: string
  created_at: string
}

export interface Product {
  id: number
  name: string
  price: number
  category: string
  ingredients: string[] // Cambiado a array de strings
  format_sales: string
  created_at: string
}

