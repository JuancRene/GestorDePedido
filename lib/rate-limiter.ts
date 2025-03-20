"use server"

import { createClient } from "@/lib/supabase"

interface RateLimiterOptions {
  windowMs: number // Ventana de tiempo en milisegundos
  maxAttempts: number // Número máximo de intentos permitidos en la ventana
}

export class RateLimiter {
  private windowMs: number
  private maxAttempts: number

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs
    this.maxAttempts = options.maxAttempts
  }

  // Verificar si una clave (IP, usuario, etc.) ha excedido el límite
  async check(key: string): Promise<{ success: boolean; attempts: number; timeLeft: number }> {
    const supabase = createClient()
    const now = Date.now()
    const windowStart = now - this.windowMs

    try {
      // Limpiar intentos antiguos
      await supabase.from("rate_limits").delete().lt("timestamp", windowStart)

      // Obtener intentos actuales
      const { data, error, count } = await supabase
        .from("rate_limits")
        .select("*", { count: "exact" })
        .eq("key", key)
        .gte("timestamp", windowStart)

      if (error) {
        // Si la tabla no existe, crearla
        if (error.code === "42P01") {
          await this.createRateLimitTable()
          return { success: true, attempts: 0, timeLeft: 0 }
        }
        console.error("Error al verificar límite de tasa:", error)
        // En caso de error, permitir el acceso
        return { success: true, attempts: 0, timeLeft: 0 }
      }

      const attempts = count || 0

      if (attempts >= this.maxAttempts) {
        // Calcular tiempo restante hasta que expire el primer intento
        const oldestAttempt = data?.sort((a, b) => a.timestamp - b.timestamp)[0]
        const timeLeft = oldestAttempt ? oldestAttempt.timestamp + this.windowMs - now : this.windowMs

        return { success: false, attempts, timeLeft }
      }

      return { success: true, attempts, timeLeft: 0 }
    } catch (error) {
      console.error("Error en el limitador de tasa:", error)
      // En caso de error, permitir el acceso
      return { success: true, attempts: 0, timeLeft: 0 }
    }
  }

  // Incrementar el contador de intentos para una clave
  async increment(key: string): Promise<void> {
    const supabase = createClient()
    const now = Date.now()

    try {
      await supabase.from("rate_limits").insert([{ key, timestamp: now }])
    } catch (error) {
      // Si la tabla no existe, crearla e intentar de nuevo
      if (error.code === "42P01") {
        await this.createRateLimitTable()
        await supabase.from("rate_limits").insert([{ key, timestamp: now }])
      } else {
        console.error("Error al incrementar límite de tasa:", error)
      }
    }
  }

  // Crear la tabla de límites de tasa si no existe
  private async createRateLimitTable(): Promise<void> {
    const supabase = createClient()

    // Usar SQL directo para crear la tabla
    const { error } = await supabase.rpc("create_rate_limit_table")

    if (error) {
      console.error("Error al crear tabla de límites de tasa:", error)
    }
  }
}

