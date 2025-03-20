import { Suspense } from "react"
import { getUser } from "@/lib/auth"
import { AdminHeader } from "./admin-header"
import { AdminDashboard } from "./admin-dashboard"
import { AdminOrders } from "./admin-orders"

export default async function AdminPage() {
  const user = await getUser()

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AdminHeader username={user.username} />
      <main className="flex-1">
        <Suspense fallback={<div>Cargando...</div>}>
          <AdminDashboard />
        </Suspense>
        <Suspense fallback={<div>Cargando pedidos...</div>}>
          <AdminOrders />
        </Suspense>
      </main>
    </div>
  )
}

