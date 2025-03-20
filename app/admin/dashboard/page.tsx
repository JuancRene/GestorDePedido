import { Suspense } from "react"
import { getUser } from "@/lib/auth"
import { AdminHeader } from "../admin-header"
import { AnalyticsDashboard } from "./analytics-dashboard"
import { Skeleton } from "@/components/ui/skeleton"

export default async function DashboardPage() {
  const user = await getUser()

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AdminHeader username={user.username} />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Dashboard Analítico</h1>
            <p className="text-gray-500">Análisis detallado de ventas y métricas del negocio</p>
          </div>
          <Suspense
            fallback={
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
              </div>
            }
          >
            <AnalyticsDashboard />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

