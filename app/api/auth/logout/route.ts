import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    // Delete the session cookie
    cookies().delete("user_session")

    // Delete any Supabase auth cookies to be safe
    cookies()
      .getAll()
      .forEach((cookie) => {
        if (cookie.name.includes("supabase")) {
          cookies().delete(cookie.name)
        }
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error during logout:", error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

