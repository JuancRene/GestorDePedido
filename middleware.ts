import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rutas accesibles según el rol
const roleRoutes = {
  admin: ["/admin", "/cocina", "/employee", "/orders", "/products", "/categories", "/reports"],
  chef: ["/cocina", "/orders", "/products"],
  employee: ["/employee", "/orders"],
}

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/", "/login", "/api"]

export async function middleware(request: NextRequest) {
  // Verificar si la ruta es pública
  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`),
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Verificar la sesión a través de las cookies
  const authCookie = request.cookies.get("supabase-auth-token")?.value

  if (!authCookie) {
    // Si no hay cookie de autenticación, redirigir al login
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  try {
    // Parsear la cookie para obtener el token JWT
    const [, token] = JSON.parse(authCookie)

    // Decodificar el token JWT para obtener la información del usuario
    // Nota: Esto es una simplificación. En producción, deberías verificar la firma del token.
    const payload = JSON.parse(atob(token.split(".")[1]))

    // Obtener el rol del usuario desde los metadatos del token
    // Asumiendo que el rol está almacenado en los metadatos del usuario
    const userRole = payload.user_metadata?.role || "employee"

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

    return NextResponse.next()
  } catch (error) {
    // Si hay un error al procesar el token, redirigir al login
    console.error("Error en middleware:", error)
    return NextResponse.redirect(new URL("/login", request.url))
  }
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

