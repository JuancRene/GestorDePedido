import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import type { User } from "@/lib/auth"

// This route will create a session for a cocina user and redirect to the cocina dashboard
export async function GET(request: NextRequest) {
  const user: User = {
    id: 2,
    username: "chef",
    role: "cocina",
    name: "Chef",
    employeeId: 2,
  }

  // Set the user session cookie
  cookies().set("user_session", JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "lax",
  })

  // Redirect to the cocina dashboard
  return NextResponse.redirect(new URL("/cocina", request.url))
}

