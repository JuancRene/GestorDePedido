import { Suspense } from "react"
import { getUser } from "@/lib/auth"
import { EmpleadoHeader } from "./empleado-header"
import { TouchOrderScreen } from "./touch-order-screen"

export default async function EmpleadoPage() {
  const user = await getUser()

  if (!user) {
    return null // This should be handled by middleware
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <EmpleadoHeader username={user.username} />
      <main className="flex-1 p-4">
        <Suspense fallback={<div>Cargando...</div>}>
          <TouchOrderScreen />
        </Suspense>
      </main>
    </div>
  )
}

