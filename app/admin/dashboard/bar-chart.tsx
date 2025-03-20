"use client"

import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "@/components/ui/card"

interface BarChartProps {
  data: Array<{ category: string; total: number }>
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function BarChart({ data }: BarChartProps) {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] bg-gray-50 rounded-md border border-dashed border-gray-200">
        <p className="text-gray-500 text-sm">No hay datos disponibles</p>
      </div>
    )
  }

  // Log data for debugging
  console.log("BarChart data:", data)

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsBarChart data={data}>
        <XAxis
          dataKey="category"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          interval={0}
          tick={{ angle: -45, textAnchor: "end", dominantBaseline: "ideographic" }}
          height={70}
        />
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
                      <span className="font-medium">{payload[0].payload.category}</span>
                      <span className="font-bold">{formatCurrency(payload[0].value as number)}</span>
                    </div>
                  </div>
                </Card>
              )
            }
            return null
          }}
        />
        <Bar dataKey="total" fill="#dc2626" radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

