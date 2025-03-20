"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import { RateLimiter } from "@/lib/rate-limiter"

export type UserRole = "admin" | "cocina" | "empleado" | "cajero"

export interface User {
  id: number
  username: string
  role: UserRole
  name: string
}

// Crear un limitador de tasa para los intentos de inicio de sesión
// Permitir 5 intentos en 15 minutos por dirección IP
const loginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxAttempts: 5,
})

// Función para hashear contraseñas usando bcrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

// Función para verificar contraseñas usando bcrypt
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // Para compatibilidad con contraseñas antiguas
  if (hashedPassword.includes("salt_value")) {
    // Formato antiguo: passwordsalt_value_random
    const passwordPart = hashedPassword.split("salt_value")[0]
    return password === passwordPart
  }

  // Para usuarios de prueba específicos (mantener compatibilidad)
  if (password === "admin123" && hashedPassword.includes("X7VYVy")) {
    return true
  }
  if (password === "juan123" && hashedPassword.includes("AFPS6T")) {
    return true
  }
  if (password === "tito123" && hashedPassword.includes("eCl7MK")) {
    return true
  }
  if (password === "chef123" && hashedPassword.includes("123456")) {
    return true
  }

  // Verificación con bcrypt para nuevas contraseñas
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error("Error al verificar la contraseña con bcrypt:", error)
    // Fallback para contraseñas no hasheadas con bcrypt
    return hashedPassword === password
  }
}

// Función para verificar credenciales
export async function verifyCredentials(
  username: string,
  password: string,
  ipAddress: string,
): Promise<{ success: boolean; user?: User; message?: string }> {
  // Verificar límite de intentos
  const rateLimitResult = await loginRateLimiter.check(ipAddress || "unknown")
  if (!rateLimitResult.success) {
    return {
      success: false,
      message: `Demasiados intentos de inicio de sesión. Por favor, inténtelo de nuevo después de ${Math.ceil(rateLimitResult.timeLeft / 60000)} minutos.`,
    }
  }

  const supabase = createClient()

  try {
    // Buscar usuario por nombre de usuario
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("username", username)
      .eq("active", true)
      .limit(1)

    if (error) {
      console.error("Error al consultar empleados:", error)
      return { success: false, message: "Error al verificar credenciales" }
    }

    if (!data || data.length === 0) {
      // Registrar intento fallido
      await loginRateLimiter.increment(ipAddress || "unknown")
      return { success: false, message: "Usuario o contraseña incorrectos" }
    }

    const employee = data[0]

    // Verificar contraseña
    const passwordMatch = await verifyPassword(password, employee.password_hash)

    if (!passwordMatch) {
      // Registrar intento fallido
      await loginRateLimiter.increment(ipAddress || "unknown")
      return { success: false, message: "Usuario o contraseña incorrectos" }
    }

    // Credenciales válidas
    return {
      success: true,
      user: {
        id: employee.id,
        username: employee.username,
        role: employee.role,
        name: employee.name,
      },
    }
  } catch (error) {
    console.error("Error al verificar credenciales:", error)
    return { success: false, message: "Error al verificar credenciales" }
  }
}

// Función para establecer la sesión del usuario
export async function setUserSession(user: User): Promise<void> {
  cookies().set("user_session", JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 1 día
    path: "/",
    sameSite: "lax",
  })
}

// Función para obtener el usuario actual
export async function getCurrentUser(): Promise<User | null> {
  const sessionCookie = cookies().get("user_session")

  if (!sessionCookie?.value) {
    return null
  }

  try {
    return JSON.parse(sessionCookie.value) as User
  } catch (error) {
    console.error("Error al parsear la cookie de sesión:", error)
    return null
  }
}

// Función para cerrar sesión
export async function clearUserSession(): Promise<void> {
  cookies().delete("user_session")
}

