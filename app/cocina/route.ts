import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  // Get the form data
  const formData = await request.formData()
  const role = formData.get("role")

  // Validate the role
  if (role !== "cocina") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Redirect to the cocina page
  return NextResponse.redirect(new URL("/cocina", request.url))
}

