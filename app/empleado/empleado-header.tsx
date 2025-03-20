"use client"

import { useRouter } from "next/navigation"
import { logout } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { User, LogOut } from "lucide-react"
import { ConnectionStatus } from "@/app/components/connection-status"

interface EmpleadoHeaderProps {
  username: string
}

export function EmpleadoHeader({ username }: EmpleadoHeaderProps) {
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.push("/")
  }

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 md:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-red-600 rounded-full">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">La Pecosa</h2>
            <p className="text-sm text-gray-500">Empleado</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <ConnectionStatus />
          <span className="text-sm font-medium">Usuario: {username}</span>
          <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center space-x-1">
            <LogOut className="w-4 h-4" />
            <span>Salir</span>
          </Button>
        </div>
      </div>
    </header>
  )
}

