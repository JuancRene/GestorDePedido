import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import type { User } from "@/lib/auth"

// This route will create a session for an empleado user and redirect to the empleado dashboard
export async function GET(request: NextRequest) {
  const user: User = {
    id: 3,
    username: "empleado",
    role: "empleado",
    name: "Empleado",
    employeeId: 3,
  }

  // Set the user session cookie
  cookies().set("user_session", JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "lax",
  })

  // Redirect to the empleado dashboard
  return NextResponse.redirect(new URL("/empleado", request.url))
}

