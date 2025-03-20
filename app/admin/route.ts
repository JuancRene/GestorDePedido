import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  // Get the form data
  const formData = await request.formData()
  const role = formData.get("role")

  // Validate the role
  if (role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Redirect to the admin page
  return NextResponse.redirect(new URL("/admin", request.url))
}

