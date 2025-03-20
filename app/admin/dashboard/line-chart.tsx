"use client"

import { Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "@/components/ui/card"

interface LineChartProps {
  data: Array<{ date: string; total: number }>
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function LineChart({ data }: LineChartProps) {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] bg-gray-50 rounded-md border border-dashed border-gray-200">
        <p className="text-gray-500 text-sm">No hay datos disponibles</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsLineChart data={data}>
        <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <Card className="p-2 border shadow-lg">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{payload[0].payload.date}</span>
                      <span className="font-bold">{formatCurrency(payload[0].value as number)}</span>
                    </div>
                  </div>
                </Card>
              )
            }
            return null
          }}
        />
        <Line type="monotone" dataKey="total" stroke="#dc2626" strokeWidth={2} dot={false} />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

