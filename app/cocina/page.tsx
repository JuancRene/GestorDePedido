"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function CocinaPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simple check to ensure we're on the client side
    if (typeof window !== "undefined") {
      try {
        console.log("Cocina page loading...")

        // Set a timeout to ensure we don't get stuck in loading
        const timeoutId = setTimeout(() => {
          if (loading) {
            setError("Timeout loading dashboard. Please try refreshing the page.")
            setLoading(false)
          }
        }, 10000) // 10 second timeout

        // Attempt to render the page directly
        setLoading(false)

        // Clear timeout if we loaded successfully
        return () => clearTimeout(timeoutId)
      } catch (err) {
        console.error("Error in cocina page:", err)
        setError("An unexpected error occurred. Please try refreshing the page.")
        setLoading(false)
      }
    }
  }, [loading])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Cargando panel de cocina...</p>
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

  // Render a simple kitchen dashboard directly
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Panel de Cocina</h1>
      <p>Bienvenido al panel de cocina. Aquí podrás gestionar los pedidos y productos.</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-md shadow">
          <h2 className="text-lg font-semibold mb-2">Pedidos Pendientes</h2>
          <p>Cargando pedidos...</p>
        </div>

        <div className="bg-white p-4 rounded-md shadow">
          <h2 className="text-lg font-semibold mb-2">Productos</h2>
          <p>Cargando productos...</p>
        </div>
      </div>

      <div className="mt-4">
        <button onClick={() => (window.location.href = "/")} className="px-4 py-2 bg-gray-200 rounded-md">
          Cerrar Sesión
        </button>
      </div>
    </div>
  )
}

