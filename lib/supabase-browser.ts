"use client"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  // Reutilizar la instancia del cliente para evitar múltiples conexiones
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient(supabaseUrl, supabaseKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      auth: {
        persistSession: false, // No necesitamos persistir la sesión en el navegador
      },
      global: {
        fetch: (...args) => {
          // Usar la API de caché del navegador para mejorar el rendimiento
          return fetch(...args)
        },
      },
    })
  }

  return supabaseClient
}

