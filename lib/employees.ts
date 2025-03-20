"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { hashPassword, verifyPassword } from "@/lib/auth"

export type EmployeeRole = "empleado" | "cocina" | "cajero" | "admin"

export interface Employee {
  id: number
  name: string
  username: string
  role: EmployeeRole
  active: boolean
  created_at: string
}

export interface EmployeeInput {
  name: string
  username: string
  password: string
  role: EmployeeRole
  active?: boolean
}

export async function getEmployees(): Promise<Employee[]> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.from("employees").select("*").order("name", { ascending: true })

    if (error) {
      // Si el error es porque la tabla no existe, devolvemos un array vacío
      if (error.code === "42P01") {
        // Código PostgreSQL para "relation does not exist"
        console.error("La tabla 'employees' no existe. Por favor, crea la tabla primero.")
        return []
      }
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error fetching employees:", error)
    return []
  }
}

export async function createEmployee(
  employee: EmployeeInput,
): Promise<{ success: boolean; message?: string; employee?: Employee }> {
  const supabase = createClient()

  try {
    // Verificar si el nombre de usuario ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from("employees")
      .select("id")
      .eq("username", employee.username)
      .limit(1)

    if (checkError) {
      // Si el error es porque la tabla no existe
      if (checkError.code === "42P01") {
        return {
          success: false,
          message: "La tabla 'employees' no existe. Por favor, crea la tabla primero.",
        }
      }
      throw checkError
    }

    if (existingUser && existingUser.length > 0) {
      return {
        success: false,
        message: "El nombre de usuario ya está en uso. Por favor, elija otro.",
      }
    }

    // Hashear la contraseña con bcrypt
    const hashedPassword = await hashPassword(employee.password)

    // Crear el empleado
    const { data, error } = await supabase
      .from("employees")
      .insert([
        {
          name: employee.name,
          username: employee.username,
          password_hash: hashedPassword,
          role: employee.role,
          active: employee.active !== undefined ? employee.active : true,
        },
      ])
      .select()

    if (error) throw error

    revalidatePath("/admin/empleados")

    return {
      success: true,
      employee: data[0],
    }
  } catch (error) {
    console.error("Error creating employee:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al crear el empleado",
    }
  }
}

export async function updateEmployee(
  id: number,
  employee: Partial<EmployeeInput>,
): Promise<{ success: boolean; message?: string }> {
  const supabase = createClient()

  try {
    // Si se está actualizando el nombre de usuario, verificar que no exista
    if (employee.username) {
      const { data: existingUser, error: checkError } = await supabase
        .from("employees")
        .select("id")
        .eq("username", employee.username)
        .neq("id", id)
        .limit(1)

      if (checkError) {
        // Si el error es porque la tabla no existe
        if (checkError.code === "42P01") {
          return {
            success: false,
            message: "La tabla 'employees' no existe. Por favor, crea la tabla primero.",
          }
        }
        throw checkError
      }

      if (existingUser && existingUser.length > 0) {
        return {
          success: false,
          message: "El nombre de usuario ya está en uso. Por favor, elija otro.",
        }
      }
    }

    // Preparar datos para actualizar
    const updateData: Record<string, any> = {
      name: employee.name,
      username: employee.username,
      role: employee.role,
      active: employee.active,
    }

    // Si hay una nueva contraseña, hashearla con bcrypt
    if (employee.password) {
      updateData.password_hash = await hashPassword(employee.password)
    }

    // Eliminar campos undefined
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    // Actualizar el empleado
    const { error } = await supabase.from("employees").update(updateData).eq("id", id)

    if (error) throw error

    revalidatePath("/admin/empleados")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error updating employee:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al actualizar el empleado",
    }
  }
}

export async function deleteEmployee(id: number): Promise<{ success: boolean; message?: string }> {
  const supabase = createClient()

  try {
    // Verificar si es el último administrador
    if (await isLastAdmin(id)) {
      return {
        success: false,
        message: "No se puede eliminar el último administrador del sistema.",
      }
    }

    const { error } = await supabase.from("employees").delete().eq("id", id)

    if (error) throw error

    revalidatePath("/admin/empleados")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Error deleting employee:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al eliminar el empleado",
    }
  }
}

// Función para verificar si es el último administrador
async function isLastAdmin(id: number): Promise<boolean> {
  const supabase = createClient()

  try {
    const { data, error, count } = await supabase.from("employees").select("id", { count: "exact" }).eq("role", "admin")

    if (error) {
      // Si el error es porque la tabla no existe
      if (error.code === "42P01") {
        return false
      }
      throw error
    }

    // Si solo hay un administrador y es el que estamos intentando eliminar
    if (count === 1 && data[0].id === id) {
      return true
    }

    return false
  } catch (error) {
    console.error("Error checking admin count:", error)
    return false
  }
}

// Función para verificar credenciales (para login)
export async function checkEmployeeCredentials(
  username: string,
  password: string,
): Promise<{ valid: boolean; employee?: Employee }> {
  const supabase = createClient()

  console.log("Verificando credenciales para:", username)

  try {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("username", username)
      .eq("active", true)
      .limit(1)

    if (error) {
      // Si el error es porque la tabla no existe
      if (error.code === "42P01") {
        console.error("La tabla 'employees' no existe. Por favor, crea la tabla primero.")
        return { valid: false }
      }
      console.error("Error al consultar empleados:", error)
      throw error
    }

    console.log("Resultado de la consulta:", data)

    if (!data || data.length === 0) {
      console.log("No se encontró el usuario:", username)
      return { valid: false }
    }

    const employee = data[0]
    console.log("Empleado encontrado:", {
      id: employee.id,
      username: employee.username,
      role: employee.role,
      passwordHash: employee.password_hash,
      passwordLength: employee.password_hash ? employee.password_hash.length : 0,
    })

    // Verificar la contraseña usando el nuevo servicio
    const passwordMatch = await verifyPassword(password, employee.password_hash)
    console.log("Contraseña proporcionada:", password)
    console.log("Resultado de verificación de contraseña:", passwordMatch)

    if (!passwordMatch) {
      return { valid: false }
    }

    return {
      valid: true,
      employee,
    }
  } catch (error) {
    console.error("Error checking employee credentials:", error)
    return { valid: false }
  }
}

