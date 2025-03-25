import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const sessionCookie = cookies().get("user_session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false })
    }

    try {
      const user = JSON.parse(sessionCookie.value)
      return NextResponse.json({
        authenticated: true,
        role: user.role,
        username: user.username,
        name: user.name,
      })
    } catch (error) {
      console.error("Error al parsear la cookie de sesión:", error)
      return NextResponse.json({ authenticated: false })
    }
  } catch (error) {
    console.error("Error checking authentication:", error)
    return NextResponse.json({ authenticated: false })
  }
}

