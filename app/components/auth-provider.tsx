"use client"

import type React from "react"

import { usePathname, useRouter } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"

// Credenciales hardcoded
const CREDENTIALS = {
  admin: {
    username: "admin",
    password: "admin123",
  },
  empleado: {
    username: "empleado",
    password: "empleado123",
  },
  cocina: {
    username: "cocina",
    password: "cocina123",
  },
}

type AuthContextType = {
  isAuthenticated: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
  userRole: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage("isAuthenticated", false)
  const [userRole, setUserRole] = useLocalStorage("userRole", null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Verificar credenciales
  const login = (username: string, password: string) => {
    // Verificar credenciales de administrador
    if (username === CREDENTIALS.admin.username && password === CREDENTIALS.admin.password) {
      setIsAuthenticated(true)
      setUserRole("admin")
      return true
    }

    // Verificar credenciales de empleado
    if (username === CREDENTIALS.empleado.username && password === CREDENTIALS.empleado.password) {
      setIsAuthenticated(true)
      setUserRole("empleado")
      return true
    }

    // Verificar credenciales de cocina
    if (username === CREDENTIALS.cocina.username && password === CREDENTIALS.cocina.password) {
      setIsAuthenticated(true)
      setUserRole("cocina")
      return true
    }

    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUserRole(null)
    router.push("/login")
  }

  useEffect(() => {
    // Verificar autenticación al cargar
    setIsLoading(true)

    // Simular un pequeño retraso para evitar parpadeos
    const timer = setTimeout(() => {
      if (!isAuthenticated && pathname !== "/login") {
        router.push("/login")
      } else if (isAuthenticated && pathname === "/login") {
        router.push("/")
      }
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [isAuthenticated, pathname, router])

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, userRole }}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

