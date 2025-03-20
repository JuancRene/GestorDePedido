"use client"

import { Suspense } from "react"
import { KitchenHeader } from "./kitchen-header"
import { PendingOrders } from "./pending-orders"
import { CompletedOrders } from "./completed-orders"
import { PendingItemsSummary } from "./pending-items-summary"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SortOrdersControl } from "./sort-orders-control"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import RoleGuard from "@/components/role-guard"

export default function KitchenPage() {
  return (
    <RoleGuard allowedRoles={["admin", "chef"]}>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <KitchenHeader username={getUser().username} />

        <main className="flex-1 p-4 md:p-6 animate-fadeIn">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold">Panel de Cocina</h1>
                <p className="text-gray-500">Gestiona los pedidos y prepara los productos</p>
              </div>
              <SortOrdersControl />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
              <div className="lg:col-span-3">
                <PendingItemsSummary />
              </div>
              <div className="lg:col-span-1">
                <Card className="bg-gradient-to-br from-primary-600 to-primary-700 text-white">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-2">Resumen</h2>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Pedidos pendientes</span>
                        <span className="text-xl font-bold">12</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Pedidos completados</span>
                        <span className="text-xl font-bold">24</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Tiempo promedio</span>
                        <span className="text-xl font-bold">18 min</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="mb-4 bg-white p-1 rounded-lg border">
                <TabsTrigger
                  value="pending"
                  className="text-lg data-[state=active]:bg-primary-600 data-[state=active]:text-white"
                >
                  Pedidos Pendientes
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="text-lg data-[state=active]:bg-primary-600 data-[state=active]:text-white"
                >
                  Pedidos Realizados
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="animate-slideUp">
                <Suspense fallback={<OrdersSkeleton count={6} />}>
                  <PendingOrders />
                </Suspense>
              </TabsContent>

              <TabsContent value="completed" className="animate-slideUp">
                <Suspense fallback={<OrdersSkeleton count={6} />}>
                  <CompletedOrders />
                </Suspense>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </RoleGuard>
  )
}

async function getUser() {
  return {
    username: "test",
  }
}

function OrdersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50">
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
    </div>
  )
}

