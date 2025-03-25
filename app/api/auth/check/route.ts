import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    // Get the session cookie
    const sessionCookie = (await cookies()).get("user_session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Parse the session cookie
    const user = JSON.parse(sessionCookie.value)

    return NextResponse.json({
      authenticated: true,
      user: {
        username: user.username,
        role: user.role,
        name: user.name || user.username,
      },
    })
  } catch (error) {
    console.error("Error checking authentication:", error)
    return NextResponse.json({ error: "Error checking authentication" }, { status: 500 })
  }
}

