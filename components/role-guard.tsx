"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: string[]
  fallbackUrl?: string
}

export default function RoleGuard({ children, allowedRoles, fallbackUrl = "/login" }: RoleGuardProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkUserRole() {
      try {
        const supabase = createClient()

        // Obtener la sesión actual
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push(fallbackUrl)
          return
        }

        // Obtener el rol del usuario desde los metadatos de la sesión
        const userRole = session.user.user_metadata?.role || "employee"

        // Verificar si el rol del usuario está en los roles permitidos
        const hasAccess = allowedRoles.includes(userRole)

        setIsAuthorized(hasAccess)

        if (!hasAccess) {
          // Determinar la URL de redirección basada en el rol del usuario
          let redirectUrl = "/login"

          if (userRole === "admin") {
            redirectUrl = "/admin"
          } else if (userRole === "chef") {
            redirectUrl = "/cocina"
          } else if (userRole === "employee") {
            redirectUrl = "/employee"
          }

          router.push(redirectUrl)
        }
      } catch (error) {
        console.error("Error al verificar el rol del usuario:", error)
        router.push(fallbackUrl)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserRole()
  }, [router, allowedRoles, fallbackUrl])

  // Mostrar un indicador de carga mientras se verifica la autorización
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>
  }

  // Renderizar los hijos solo si el usuario está autorizado
  return isAuthorized ? <>{children}</> : null
}

