import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define public routes that don't require authentication
const publicRoutes = ["/", "/api/auth/login", "/api/auth/check", "/api/auth/logout"]

export function middleware(request: NextRequest) {
  // TEMPORARY: Allow all access during debugging
  return NextResponse.next()

  /*
  const { pathname } = request.nextUrl
  
  // Allow access to public routes
  if (publicRoutes.includes(pathname) || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // Check for user session cookie
  const sessionCookie = request.cookies.get('user_session')
  
  // If no session cookie, redirect to login
  if (!sessionCookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }
  
  try {
    // Parse the session cookie
    const user = JSON.parse(sessionCookie.value)
    
    // Check if user has access to the requested route
    if (pathname.startsWith('/admin') && user.role !== 'admin') {
      // Redirect non-admin users away from admin routes
      const url = request.nextUrl.clone()
      url.pathname = `/${user.role}`
      return NextResponse.redirect(url)
    }
    
    if (pathname.startsWith('/cocina') && user.role !== 'cocina' && user.role !== 'admin') {
      // Redirect non-kitchen users away from kitchen routes
      const url = request.nextUrl.clone()
      url.pathname = `/${user.role}`
      return NextResponse.redirect(url)
    }
    
    if (pathname.startsWith('/empleado') && user.role !== 'empleado' && user.role !== 'admin') {
      // Redirect non-employee users away from employee routes
      const url = request.nextUrl.clone()
      url.pathname = `/${user.role}`
      return NextResponse.redirect(url)
    }
    
    // Allow access if all checks pass
    return NextResponse.next()
  } catch (error) {
    // If there's an error parsing the cookie, redirect to login
    console.error('Error in middleware:', error)
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }
  */
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public assets)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
}

