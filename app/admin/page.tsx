"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/app/components/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function AdminPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/login")
    }
  }, [user, router])

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Panel de Administración</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Productos</CardTitle>
            <CardDescription>Administra el catálogo de productos</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Añade, edita o elimina productos del catálogo.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/products">Ir a Productos</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gestión de Categorías</CardTitle>
            <CardDescription>Administra las categorías de productos</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Añade o elimina categorías para organizar tus productos.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/categories">Ir a Categorías</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gestión de Órdenes</CardTitle>
            <CardDescription>Administra las órdenes de los clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Visualiza y gestiona las órdenes recibidas.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/orders">Ir a Órdenes</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="mt-8 flex justify-end">
        <Button variant="outline" onClick={logout}>
          Cerrar Sesión
        </Button>
      </div>
    </div>
  )
}

