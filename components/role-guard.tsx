"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()

        // Obtener la sesión actual
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/login")
          return
        }

        // Obtener el rol del usuario
        const { data: userData, error } = await supabase.from("users").select("role").eq("id", session.user.id).single()

        if (error || !userData) {
          console.error("Error al obtener el rol del usuario:", error)
          router.push("/login")
          return
        }

        const userRole = userData.role || "employee"

        // Verificar si el rol está permitido
        if (allowedRoles.includes(userRole)) {
          setAuthorized(true)
        } else {
          // Redirigir según el rol
          if (userRole === "admin") {
            router.push("/admin")
          } else if (userRole === "chef") {
            router.push("/cocina")
          } else {
            router.push("/employee")
          }
        }
      } catch (error) {
        console.error("Error al verificar la autorización:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [allowedRoles, router])

  // Mostrar un indicador de carga mientras se verifica la autorización
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>
  }

  // Renderizar los hijos solo si el usuario está autorizado
  return authorized ? <>{children}</> : null
}

