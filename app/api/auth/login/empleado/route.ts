import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  // Set a simple session cookie
  cookies().set("user_role", "employee", {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  })

  // Redirect to the empleado page
  return NextResponse.redirect(new URL("/empleado", request.url))
}

