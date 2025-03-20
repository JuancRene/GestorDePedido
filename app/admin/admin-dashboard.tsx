import { getOrders } from "@/lib/orders"
import Link from "next/link"

export async function AdminDashboard() {
  const pendingOrders = await getOrders("pending")
  const completedOrders = await getOrders("completed")

  const totalSales = completedOrders.reduce((total, order) => {
    const orderTotal = typeof order.total === "number" ? order.total : 0
    return total + orderTotal
  }, 0)

  return (
    <div className="grid grid-cols-3 gap-6 p-6">
      {/* Pedidos Pendientes */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-base font-medium text-gray-700">Pedidos Pendientes</h3>
        <p className="text-4xl font-bold mt-2">{pendingOrders.length}</p>
        <p className="text-sm text-gray-500 mt-1">Esperando preparación</p>
      </div>

      {/* Pedidos Completados */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-base font-medium text-gray-700">Pedidos Completados</h3>
        <p className="text-4xl font-bold mt-2">{completedOrders.length}</p>
        <p className="text-sm text-gray-500 mt-1">Entregados al cliente</p>
      </div>

      {/* Total Ventas */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-base font-medium text-gray-700">Total Ventas</h3>
        <p className="text-4xl font-bold mt-2">${totalSales.toLocaleString()}</p>
        <p className="text-sm text-gray-500 mt-1">
          Ingresos totales{" "}
          <Link href="/admin/dashboard" className="text-red-600 hover:underline cursor-pointer ml-2">
            (Ver dashboard)
          </Link>
        </p>
      </div>
    </div>
  )
}

