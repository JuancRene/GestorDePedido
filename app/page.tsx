"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Utensils, User, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/check", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.authenticated && data.role) {
            redirectToRolePage(data.role)
          }
        }
      } catch (error) {
        console.error("Error checking session:", error)
      }
    }

    checkSession()
  }, [])

  // Function to redirect based on role
  const redirectToRolePage = (role: string) => {
    setRedirecting(true)
    console.log(`Redirecting to ${role} dashboard...`)

    // Store role in localStorage for persistence
    localStorage.setItem("user_role", role)

    // Use direct navigation
    if (role === "admin") {
      window.location.href = "/admin"
    } else if (role === "cocina") {
      window.location.href = "/cocina"
    } else if (role === "empleado") {
      window.location.href = "/empleado"
    } else {
      setError("Rol de usuario desconocido")
      setRedirecting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setRedirecting(false)

    // Validación del lado del cliente
    if (!username.trim()) {
      setError("El nombre de usuario es obligatorio")
      setLoading(false)
      return
    }

    if (!password) {
      setError("La contraseña es obligatoria")
      setLoading(false)
      return
    }

    try {
      // Use our custom API endpoint for login
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const result = await response.json()

      if (result.success) {
        // Log the successful login and role
        console.log(`Login successful. Role: ${result.role}`)

        // Redirect based on role
        redirectToRolePage(result.role)
      } else {
        setError(result.message || "Error de autenticación")
        setLoading(false)
      }
    } catch (error) {
      console.error("Error durante el inicio de sesión:", error)
      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al intentar iniciar sesión. Por favor, inténtelo de nuevo.",
      )
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // Direct navigation to role pages for debugging
  const navigateToRole = (role: string) => {
    window.location.href = `/${role}`
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8">
        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-6 text-center">
            <div className="mx-auto bg-gradient-to-r from-primary-600 to-primary-700 w-20 h-20 rounded-full flex items-center justify-center">
              <Utensils className="w-10 h-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold">La Pecosa</CardTitle>
              <CardDescription className="text-lg">Sistema de Gestión</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {redirecting ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-center">Redireccionando al panel de control...</p>
                <div className="mt-6 space-y-2">
                  <p className="text-sm text-gray-500">
                    Si no eres redirigido automáticamente, haz clic en uno de estos enlaces:
                  </p>
                  <div className="flex justify-center space-x-4">
                    <Button variant="outline" size="sm" onClick={() => navigateToRole("admin")}>
                      Admin
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateToRole("cocina")}>
                      Cocina
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateToRole("empleado")}>
                      Empleado
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-base">
                      Usuario
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="pl-10 py-6 bg-gray-50 border-gray-200 focus:border-primary-500 focus:ring-primary-500"
                        placeholder="Nombre de usuario"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base">
                      Contraseña
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 pr-10 py-6 bg-gray-50 border-gray-200 focus:border-primary-500 focus:ring-primary-500"
                        placeholder="Contraseña"
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-gray-600 focus:outline-none"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-red-50 text-red-600 border border-red-200">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full py-6 text-lg bg-primary-600 hover:bg-primary-700 transition-all btn-effect"
                  disabled={loading || redirecting}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Ingresando...
                    </span>
                  ) : (
                    "Ingresar"
                  )}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} La Pecosa. Todos los derechos reservados.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

