"use client"

import { useRouter } from "next/navigation"
import { logout } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Utensils, LogOut } from "lucide-react"
import { useState, useEffect, useCallback, memo } from "react"

interface KitchenHeaderProps {
  username: string
}

// Usar memo para evitar re-renderizados innecesarios
export const KitchenHeader = memo(function KitchenHeader({ username }: KitchenHeaderProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())

  // Update time every minute - optimizado
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Format date and time - memoizado para evitar cálculos repetidos
  const { formattedDate, formattedTime } = useCallback(() => {
    // Format date like "jueves, 13 de marzo de 2025"
    const date = new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(currentDate)

    // Format time like "14:14"
    const time = new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(currentDate)

    return { formattedDate: date, formattedTime: time }
  }, [currentDate])

  // Optimizar la función de logout con useCallback
  const handleLogout = useCallback(async () => {
    await logout()
    router.push("/")
  }, [router])

  return (
    <header className="bg-primary-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full">
              <Utensils className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="font-bold text-lg">La Pecosa</h2>
              <p className="text-sm opacity-90">Cocina</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end text-sm">
              <span className="font-medium">{formattedTime}</span>
              <span className="text-xs opacity-90">{formattedDate}</span>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span>Usuario: {username}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white hover:bg-primary-700">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
})

