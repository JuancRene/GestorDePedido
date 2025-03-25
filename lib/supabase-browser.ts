import { createClient } from "@supabase/supabase-js"

// Create a single instance of the Supabase client with auth completely disabled
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const getSupabaseBrowserClient = () => {
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Initialize the client with auth disabled
  supabaseInstance = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
        flowType: "pkce",
      },
    },
  )

  return supabaseInstance
}

// Use this function to get the Supabase client in browser components
export const createBrowserClient = () => {
  return getSupabaseBrowserClient()
}

