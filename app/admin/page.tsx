"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simple check to ensure we're on the client side
    if (typeof window !== "undefined") {
      try {
        console.log("Admin page loading...")
        setTimeout(() => {
          setLoading(false)
        }, 1000)
      } catch (err) {
        console.error("Error in admin page:", err)
        setError("An unexpected error occurred. Please try refreshing the page.")
        setLoading(false)
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Cargando panel de administración...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 text-red-600 p-4 rounded-md max-w-md">
          <h2 className="text-lg font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary text-white rounded-md">
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Órdenes</h2>
          <p className="mb-4">Gestiona las órdenes de los clientes.</p>
          <Link href="/admin/orders" className="text-primary hover:underline">
            Ver órdenes →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Productos</h2>
          <p className="mb-4">Administra el catálogo de productos.</p>
          <Link href="/admin/productos" className="text-primary hover:underline">
            Ver productos →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Clientes</h2>
          <p className="mb-4">Gestiona la información de los clientes.</p>
          <Link href="/admin/clientes" className="text-primary hover:underline">
            Ver clientes →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Empleados</h2>
          <p className="mb-4">Administra los empleados del sistema.</p>
          <Link href="/admin/empleados" className="text-primary hover:underline">
            Ver empleados →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Estadísticas</h2>
          <p className="mb-4">Visualiza estadísticas y reportes.</p>
          <Link href="/admin/dashboard" className="text-primary hover:underline">
            Ver estadísticas →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Configuración</h2>
          <p className="mb-4">Configura los parámetros del sistema.</p>
          <Link href="/admin/settings" className="text-primary hover:underline">
            Ver configuración →
          </Link>
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => {
            document.cookie.split(";").forEach((c) => {
              document.cookie = c.replace(/^ +/, "").replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`)
            })
            localStorage.clear()
            window.location.href = "/"
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}

