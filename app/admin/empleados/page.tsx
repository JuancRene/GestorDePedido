import { Suspense } from "react"
import { getUser } from "@/lib/auth"
import { AdminHeader } from "../admin-header"
import { EmployeesSection } from "./employees-section"

export default async function EmployeesPage() {
  const user = await getUser()

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <AdminHeader username={user.username} />
      <main className="flex-1">
        <Suspense fallback={<div>Cargando...</div>}>
          <EmployeesSection />
        </Suspense>
      </main>
    </div>
  )
}

