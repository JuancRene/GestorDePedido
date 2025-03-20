import { getOrders } from "@/lib/orders"
import { OrderCard } from "../cocina/order-card"

export async function CompletedOrders() {
  const completedOrders = await getOrders("completed")

  if (completedOrders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No hay pedidos realizados</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {completedOrders.map((order) => (
        <OrderCard key={order.id} order={order} showCompleteButton={false} />
      ))}
    </div>
  )
}

