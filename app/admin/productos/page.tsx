import { Suspense } from "react"
import { getUser } from "@/lib/auth"
import { AdminHeader } from "../admin-header"
import { ProductsSection } from "./products-section"

export default async function ProductsPage() {
  const user = await getUser()

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <AdminHeader username={user.username} />
      <main className="flex-1">
        <Suspense fallback={<div>Cargando...</div>}>
          <ProductsSection />
        </Suspense>
      </main>
    </div>
  )
}

