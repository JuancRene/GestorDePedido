"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function EmpleadoPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simple check to ensure we're on the client side
    if (typeof window !== "undefined") {
      try {
        console.log("Empleado page loading...")
        setTimeout(() => {
          setLoading(false)
        }, 1000)
      } catch (err) {
        console.error("Error in empleado page:", err)
        setError("An unexpected error occurred. Please try refreshing the page.")
        setLoading(false)
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Cargando panel de empleado...</p>
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
      <h1 className="text-3xl font-bold mb-6">Panel de Empleado</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Crear Orden</h2>
          <p className="mb-4">Crea una nueva orden para un cliente.</p>
          <Link href="/empleado/create-order" className="text-primary hover:underline">
            Crear orden →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Órdenes Pendientes</h2>
          <p className="mb-4">Visualiza y gestiona las órdenes pendientes.</p>
          <Link href="/empleado/pending-orders" className="text-primary hover:underline">
            Ver órdenes pendientes →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Órdenes Completadas</h2>
          <p className="mb-4">Historial de órdenes completadas.</p>
          <Link href="/empleado/completed-orders" className="text-primary hover:underline">
            Ver órdenes completadas →
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Clientes</h2>
          <p className="mb-4">Gestiona la información de los clientes.</p>
          <Link href="/empleado/clients" className="text-primary hover:underline">
            Ver clientes →
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

