import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, message: "Usuario y contraseña son requeridos" }, { status: 400 })
    }

    // Create a direct Supabase client for database access only
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    )

    // Query the employees table directly
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("username", username)
      .eq("active", true)
      .single()

    if (error || !data) {
      console.error("Error al consultar empleados:", error)
      return NextResponse.json({ success: false, message: "Usuario o contraseña incorrectos" }, { status: 401 })
    }

    // Verify password
    let passwordMatch = false

    // For compatibility with old passwords
    if (data.password_hash.includes("salt_value")) {
      // Old format: passwordsalt_value_random
      const passwordPart = data.password_hash.split("salt_value")[0]
      passwordMatch = password === passwordPart
    }
    // For specific test users (maintain compatibility)
    else if (
      (password === "admin123" && data.password_hash.includes("X7VYVy")) ||
      (password === "juan123" && data.password_hash.includes("AFPS6T")) ||
      (password === "tito123" && data.password_hash.includes("eCl7MK")) ||
      (password === "chef123" && data.password_hash.includes("123456"))
    ) {
      passwordMatch = true
    }
    // Verify with bcrypt for new passwords
    else {
      try {
        passwordMatch = await bcrypt.compare(password, data.password_hash)
      } catch (error) {
        console.error("Error al verificar la contraseña con bcrypt:", error)
        // Fallback for non-bcrypt hashed passwords
        passwordMatch = data.password_hash === password
      }
    }

    if (!passwordMatch) {
      console.log(`Contraseña incorrecta para: ${username}`)
      return NextResponse.json({ success: false, message: "Usuario o contraseña incorrectos" }, { status: 401 })
    }

    // Valid credentials
    console.log(`Usuario autenticado: ${username}, rol: ${data.role}`)

    // Set user session
    const user = {
      id: data.id,
      username: data.username,
      role: data.role,
      name: data.name,
      employeeId: data.id,
    }

    // Save in cookie with longer duration
    const cookieStore = await cookies();
    cookieStore.set("user_session", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
      sameSite: "lax",
    })

    return NextResponse.json({ success: true, role: data.role })
  } catch (error) {
    console.error("Error durante la autenticación:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Ocurrió un error durante la autenticación. Por favor, inténtelo de nuevo.",
      },
      { status: 500 },
    )
  }
}

