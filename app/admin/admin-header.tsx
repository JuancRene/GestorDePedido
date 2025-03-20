"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import { logoutAction } from "@/lib/auth"

interface AdminHeaderProps {
  username: string
}

export function AdminHeader({ username }: AdminHeaderProps) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col">
      <div className="bg-red-600 text-white px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="La Pecosa" className="h-8 w-8" />
          <div>
            <h1 className="font-semibold text-lg">La Pecosa</h1>
            <p className="text-sm opacity-90">Sistema de Gestión</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span>Usuario: {username}</span>
          <form action={logoutAction}>
            <button type="submit" className="hover:opacity-80">
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
      <nav className="bg-black px-6 py-3 flex gap-4">
        <Link
          href="/admin"
          className={`text-white px-4 py-2 rounded transition-colors ${
            pathname === "/admin" ? "bg-[#1a1a1a]" : "hover:bg-red-600"
          }`}
        >
          Pedidos
        </Link>
        <Link
          href="/admin/productos"
          className={`text-white px-4 py-2 rounded transition-colors ${
            pathname === "/admin/productos" ? "bg-[#1a1a1a]" : "hover:bg-red-600"
          }`}
        >
          Productos
        </Link>
        <Link
          href="/admin/clientes"
          className={`text-white px-4 py-2 rounded transition-colors ${
            pathname === "/admin/clientes" ? "bg-[#1a1a1a]" : "hover:bg-red-600"
          }`}
        >
          Clientes
        </Link>
        <Link
          href="/admin/empleados"
          className={`text-white px-4 py-2 rounded transition-colors ${
            pathname === "/admin/empleados" ? "bg-[#1a1a1a]" : "hover:bg-red-600"
          }`}
        >
          Empleados
        </Link>
      </nav>
    </div>
  )
}

