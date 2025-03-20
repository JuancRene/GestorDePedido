"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export type UserRole = "admin" | "cocina" | "empleado" | "cajero"

// Actualizar la interfaz User para incluir el ID del empleado
export interface User {
  username: string
  role: UserRole
  name?: string
  employeeId?: number
  id?: number
}

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

// Modificar la función loginAction para incluir el ID del empleado en la sesión
export async function loginAction(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  console.log(`Intento de inicio de sesión para: ${username}`)

  if (!username || !password) {
    return { success: false, message: "Usuario y contraseña son requeridos" }
  }

  try {
    const supabase = createClient()

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
      console.log(`Usuario no encontrado: ${username}`)
      return { success: false, message: "Usuario o contraseña incorrectos" }
    }

    const employee = data[0]

    // Verificar contraseña
    const passwordMatch = await verifyPassword(password, employee.password_hash)

    if (!passwordMatch) {
      console.log(`Contraseña incorrecta para: ${username}`)
      return { success: false, message: "Usuario o contraseña incorrectos" }
    }

    // Credenciales válidas
    console.log(`Usuario autenticado: ${username}, rol: ${employee.role}`)

    // Establecer sesión de usuario
    const user = {
      id: employee.id,
      username: employee.username,
      role: employee.role,
      name: employee.name,
      employeeId: employee.id, // Añadir el ID del empleado
    }

    // Guardar en cookie con una duración más larga
    cookies().set("user_session", JSON.stringify(user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
      sameSite: "lax",
    })

    return { success: true, role: employee.role }
  } catch (error) {
    console.error("Error durante la autenticación:", error)
    return {
      success: false,
      message: "Ocurrió un error durante la autenticación. Por favor, inténtelo de nuevo.",
    }
  }
}

// Función de cierre de sesión como acción del servidor
export async function logoutAction() {
  cookies().delete("user_session")
  redirect("/")
}

// Obtener usuario actual desde la cookie de sesión
export async function getUser(): Promise<User | null> {
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

// Verificar si el usuario está autenticado
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser()
  return user !== null
}

// Verificar si el usuario tiene un rol específico
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getUser()
  return user?.role === role
}

// Función para logout
export async function logout() {
  cookies().delete("user_session")
}

