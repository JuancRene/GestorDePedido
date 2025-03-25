import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rutas públicas que no requieren autenticación
const publicRoutes = [
  "/",
  "/api",
  "/_next",
  "/favicon.ico",
  "/service-worker.js",
  "/manifest.json",
  "/offline.html",
  "/login",
]

export async function middleware(request: NextRequest) {
  // TEMPORARY: Allow all access during debugging
  return NextResponse.next()

  // The code below is disabled temporarily for debugging
  /*
  // Skip API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Skip service worker and manifest requests
  if (
    request.nextUrl.pathname === '/service-worker.js' ||
    request.nextUrl.pathname === '/manifest.json' ||
    request.nextUrl.pathname === '/offline.html'
  ) {
    return NextResponse.next();
  }

  // Verificar si la ruta es pública
  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`),
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For now, allow all access to simplify debugging
  return NextResponse.next();
  */
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

