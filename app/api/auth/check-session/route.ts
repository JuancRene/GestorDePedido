import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    // Get the session cookie
    const sessionCookie = (await cookies()).get("user_session")

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }

    // Parse the session cookie
    const user = JSON.parse(sessionCookie.value)

    return NextResponse.json(
      {
        authenticated: true,
        role: user.role,
        username: user.username,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error checking session:", error)
    return NextResponse.json(
      {
        authenticated: false,
        error: "Error checking session",
      },
      { status: 500 },
    )
  }
}

