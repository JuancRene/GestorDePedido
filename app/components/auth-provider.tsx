"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase"

type User = {
  id: string
  email: string
  role: string
}

type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Verificar sesión al cargar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getSession()

        if (data.session) {
          const { data: userData } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.session.user.id)
            .single()

          setUser({
            id: data.session.user.id,
            email: data.session.user.email || "",
            role: userData?.role || "user",
          })
        }
      } catch (error) {
        console.error("Error checking session:", error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  // Redireccionar según autenticación
  useEffect(() => {
    if (loading) return

    const isAuthRoute = pathname === "/login"

    if (!user && !isAuthRoute) {
      router.push("/login")
    } else if (user && isAuthRoute) {
      router.push("/")
    }
  }, [user, loading, pathname, router])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const { data: userData } = await supabase.from("profiles").select("role").eq("id", data.user.id).single()

        setUser({
          id: data.user.id,
          email: data.user.email || "",
          role: userData?.role || "user",
        })

        return true
      }

      return false
    } catch (error) {
      console.error("Error logging in:", error)
      return false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

