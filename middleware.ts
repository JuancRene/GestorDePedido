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
  // Skip API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Skip service worker and manifest requests
  if (
    request.nextUrl.pathname === "/service-worker.js" ||
    request.nextUrl.pathname === "/manifest.json" ||
    request.nextUrl.pathname === "/offline.html"
  ) {
    return NextResponse.next()
  }

  // Allow POST requests to role-specific routes
  if (
    request.method === "POST" &&
    (request.nextUrl.pathname === "/admin" ||
      request.nextUrl.pathname === "/cocina" ||
      request.nextUrl.pathname === "/empleado")
  ) {
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
  const authCookie = request.cookies.get("user_session")

  if (!authCookie) {
    // Si no hay cookie de autenticación, redirigir al login
    const redirectUrl = new URL("/", request.url)
    return NextResponse.redirect(redirectUrl)
  }

  try {
    // Parse the user session cookie
    const user = JSON.parse(authCookie.value)

    if (!user || !user.role) {
      throw new Error("Invalid user session")
    }

    // Get the user role
    const userRole = user.role

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
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}

