"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Simple check to ensure we're on the client side
    if (typeof window !== "undefined") {
      try {
        console.log("Admin page loading...")

        // Attempt to load the admin dashboard component
        import("./admin-dashboard")
          .then((module) => {
            const AdminDashboard = module.AdminDashboard
            setLoading(false)
          })
          .catch((err) => {
            console.error("Error loading admin dashboard:", err)
            setError("Error loading dashboard. Please try refreshing the page.")
            setLoading(false)
          })
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

  // This should never render directly - the dynamic import should handle rendering
  return null
}

