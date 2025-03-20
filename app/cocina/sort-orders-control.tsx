"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Calendar } from "lucide-react"

export type OrderSortType = "creation" | "pickup"

export function SortOrdersControl() {
  const [sortType, setSortType] = useState<OrderSortType>("creation")

  // When the sort type changes, store it in localStorage
  useEffect(() => {
    localStorage.setItem("kitchenOrderSort", sortType)
    // Dispatch a custom event so other components can react to the change
    window.dispatchEvent(new CustomEvent("orderSortChanged", { detail: sortType }))
  }, [sortType])

  // On initial load, check if there's a saved preference
  useEffect(() => {
    const savedSort = localStorage.getItem("kitchenOrderSort") as OrderSortType | null
    if (savedSort) {
      setSortType(savedSort)
    }
  }, [])

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Ordenar por:</span>
      <Select value={sortType} onValueChange={(value) => setSortType(value as OrderSortType)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Seleccionar orden" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="creation" className="flex items-center gap-2">
            <Calendar className="h-4 w-4 mr-2" />
            Fecha de creación
          </SelectItem>
          <SelectItem value="pickup" className="flex items-center gap-2">
            <Clock className="h-4 w-4 mr-2" />
            Hora de retiro
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

