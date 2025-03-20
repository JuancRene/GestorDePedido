import { getOrders, updateOrderStatus } from "@/lib/orders"
import { OrderCard } from "../cocina/order-card"

export async function PendingOrders() {
  const pendingOrders = await getOrders("pending")

  if (pendingOrders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No hay pedidos pendientes</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {pendingOrders.map((order) => (
        <OrderCard key={order.id} order={order} updateStatus={updateOrderStatus} showCompleteButton />
      ))}
    </div>
  )
}

