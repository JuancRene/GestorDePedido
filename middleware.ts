import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/middleware"

// Rutas accesibles según el rol
const roleRoutes = {
  admin: ["/admin", "/chef", "/employee", "/orders", "/products", "/categories", "/reports"],
  chef: ["/chef", "/orders", "/products"],
  employee: ["/employee", "/orders"],
}

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/", "/login", "/api"]

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)

  // Verificar si la ruta es pública
  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`),
  )

  if (isPublicRoute) {
    return response
  }

  // Obtener la sesión actual
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Si no hay sesión, redirigir al login
  if (!session) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Obtener el rol del usuario
  const { data: userData, error } = await supabase.from("users").select("role").eq("id", session.user.id).single()

  if (error || !userData) {
    // Si hay error o no se encuentra el usuario, cerrar sesión y redirigir al login
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const userRole = userData.role || "employee"

  // Verificar si el usuario tiene acceso a la ruta solicitada
  const allowedRoutes = roleRoutes[userRole as keyof typeof roleRoutes] || []
  const hasAccess = allowedRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`),
  )

  // Si no tiene acceso, redirigir a la página principal según su rol
  if (!hasAccess) {
    const defaultRoute = roleRoutes[userRole as keyof typeof roleRoutes]?.[0] || "/login"
    return NextResponse.redirect(new URL(defaultRoute, request.url))
  }

  return response
}

// Configurar las rutas que deben ser procesadas por el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}

