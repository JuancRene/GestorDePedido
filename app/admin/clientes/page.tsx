import { Suspense } from "react"
import { getUser } from "@/lib/auth"
import { AdminHeader } from "../admin-header"
import { ClientsSection } from "./clients-section"

export default async function ClientsPage() {
  const user = await getUser()

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <AdminHeader username={user.username} />
      <main className="flex-1">
        <Suspense fallback={<div>Cargando...</div>}>
          <ClientsSection />
        </Suspense>
      </main>
    </div>
  )
}

