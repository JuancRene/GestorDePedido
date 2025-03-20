"use client"

import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from "recharts"
import { Card } from "@/components/ui/card"
import { useState } from "react"

interface PieChartProps {
  data: Array<{ name: string; value: number; color: string }>
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Active shape component for better hover effect
const renderActiveShape = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props
  const RADIAN = Math.PI / 180
  const sin = Math.sin(-RADIAN * midAngle)
  const cos = Math.cos(-RADIAN * midAngle)
  const sx = cx + (outerRadius + 10) * cos
  const sy = cy + (outerRadius + 10) * sin
  const mx = cx + (outerRadius + 30) * cos
  const my = cy + (outerRadius + 30) * sin
  const ex = mx + (cos >= 0 ? 1 : -1) * 22
  const ey = my
  const textAnchor = cos >= 0 ? "start" : "end"

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" fontSize={12}>
        {payload.name}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" fontSize={12}>
        {`${(percent * 100).toFixed(2)}%`}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={36} textAnchor={textAnchor} fill="#333" fontSize={12}>
        {formatCurrency(value)}
      </text>
    </g>
  )
}

// Función para consolidar datos duplicados
function consolidateData(data: Array<{ name: string; value: number; color: string }>) {
  const consolidatedMap = new Map<string, { value: number; color: string }>()

  // Define specific colors for payment methods
  const paymentMethodColors = {
    Efectivo: "#4CAF50", // Green
    Crédito: "#F44336", // Red
    Débito: "#03A9F4", // Light blue
    QR: "#FFEB3B", // Yellow
  }

  data.forEach((item) => {
    // Assign the specific color based on payment method name
    const color = paymentMethodColors[item.name as keyof typeof paymentMethodColors] || item.color

    if (consolidatedMap.has(item.name)) {
      const existing = consolidatedMap.get(item.name)!
      consolidatedMap.set(item.name, {
        value: existing.value + item.value,
        color: color, // Use our defined color
      })
    } else {
      consolidatedMap.set(item.name, { value: item.value, color: color })
    }
  })

  return Array.from(consolidatedMap.entries()).map(([name, { value, color }]) => ({
    name,
    value,
    color,
  }))
}

export function PieChart({ data }: PieChartProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  // Consolidar datos para evitar duplicados
  const consolidatedData = consolidateData(data)

  // Handle empty data
  if (!consolidatedData || consolidatedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] bg-gray-50 rounded-md border border-dashed border-gray-200">
        <p className="text-gray-500 text-sm">No hay datos disponibles</p>
      </div>
    )
  }

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  // Calculate total for percentage
  const total = consolidatedData.reduce((sum, item) => sum + item.value, 0)

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsPieChart>
        <Pie
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={consolidatedData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          dataKey="value"
          nameKey="name"
          onMouseEnter={onPieEnter}
        >
          {consolidatedData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <Card className="p-2 border shadow-lg">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{payload[0].name}</span>
                      <span className="font-bold">{formatCurrency(payload[0].value as number)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {((payload[0].payload.value / total) * 100).toFixed(1)}% del total
                    </div>
                  </div>
                </Card>
              )
            }
            return null
          }}
        />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}

