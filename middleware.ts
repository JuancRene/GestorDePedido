import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rutas accesibles según el rol
const roleRoutes = {
  admin: ["/admin", "/cocina", "/employee", "/orders", "/products", "/categories", "/reports"],
  chef: ["/cocina", "/orders", "/products"],
  employee: ["/employee", "/orders"],
}

// Rutas públicas que no requieren autenticación
const publicRoutes = ["/", "/api", "/_next", "/favicon.ico", "/service-worker.js", "/manifest.json", "/offline.html"]

export async function middleware(request: NextRequest) {
  // Completely skip service worker requests
  if (request.nextUrl.pathname === "/service-worker.js") {
    return NextResponse.next()
  }

  // Verificar si la ruta es pública
  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`),
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Verificar la sesión a través de las cookies
  const authCookie = request.cookies.get("supabase-auth-token")

  if (!authCookie) {
    // Si no hay cookie de autenticación, redirigir al login
    const redirectUrl = new URL("/", request.url)
    return NextResponse.redirect(redirectUrl)
  }

  try {
    // Obtener el token JWT de la cookie
    const tokenData = JSON.parse(authCookie.value)
    const token = tokenData[1] // El token está en la posición 1 del array

    if (!token) {
      throw new Error("Token no encontrado")
    }

    // Decodificar el token JWT para obtener la información del usuario
    const payload = JSON.parse(atob(token.split(".")[1]))

    // Obtener el rol del usuario desde los metadatos del token
    const userRole = payload.user_metadata?.role || "employee"

    // Verificar si el usuario tiene acceso a la ruta solicitada
    const allowedRoutes = roleRoutes[userRole as keyof typeof roleRoutes] || []
    const hasAccess = allowedRoutes.some(
      (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`),
    )

    // Si no tiene acceso, redirigir a la página principal según su rol
    if (!hasAccess) {
      const defaultRoute = roleRoutes[userRole as keyof typeof roleRoutes]?.[0] || "/"
      return NextResponse.redirect(new URL(defaultRoute, request.url))
    }

    return NextResponse.next()
  } catch (error) {
    // Si hay un error al procesar el token, redirigir al login
    console.error("Error en middleware:", error)
    return NextResponse.redirect(new URL("/", request.url))
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
     * - service-worker.js (service worker)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|service-worker.js).*)",
  ],
}

