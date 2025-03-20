import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import type { UserRole } from "./auth"

// Interfaz para el payload del token
export interface JwtPayload {
  sub: string
  username: string
  role: UserRole
  employeeId?: number
  name?: string
  iat?: number
  exp?: number
}

// Obtener la clave secreta desde las variables de entorno
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    console.error("JWT_SECRET no está definido en las variables de entorno")
    // Proporcionar un valor predeterminado para desarrollo (no usar en producción)
    return "default_jwt_secret_for_development"
  }
  return secret
}

// Generar un token JWT
export const generateToken = (payload: Omit<JwtPayload, "iat" | "exp">): string => {
  try {
    const secret = getJwtSecret()
    return jwt.sign(payload, secret, {
      expiresIn: "24h", // El token expira en 24 horas
    })
  } catch (error) {
    console.error("Error al generar el token JWT:", error)
    throw new Error("No se pudo generar el token JWT")
  }
}

// Verificar y decodificar un token JWT
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const secret = getJwtSecret()
    return jwt.verify(token, secret) as JwtPayload
  } catch (error) {
    console.error("Error al verificar el token JWT:", error)
    return null
  }
}

// Establecer el token en las cookies
export const setTokenCookie = (token: string): void => {
  try {
    const cookieStore = cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 día en segundos
      path: "/",
      sameSite: "lax", // Changed from 'strict' to 'lax' for better compatibility
    })
  } catch (error) {
    console.error("Error al establecer la cookie del token:", error)
    throw new Error("No se pudo establecer la cookie del token")
  }
}

// Obtener el token de las cookies
export const getTokenFromCookies = (): string | undefined => {
  try {
    const cookieStore = cookies()
    const cookie = cookieStore.get("auth_token")
    return cookie?.value
  } catch (error) {
    console.error("Error al obtener la cookie del token:", error)
    return undefined
  }
}

// Eliminar el token de las cookies
export const removeTokenCookie = (): void => {
  try {
    const cookieStore = cookies()
    cookieStore.delete("auth_token")
  } catch (error) {
    console.error("Error al eliminar la cookie del token:", error)
    throw new Error("No se pudo eliminar la cookie del token")
  }
}

