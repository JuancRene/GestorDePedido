"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface TouchCalendarProps {
  value: string
  onChange: (value: string) => void
  onClose?: () => void
}

export function TouchCalendar({ value, onChange, onClose }: TouchCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    return value ? new Date(value) : new Date()
  })

  const month = currentDate.getMonth()
  const year = currentDate.getFullYear()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()

  // Adjust for Sunday as first day (0)
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleDayClick = (day: number) => {
    const selectedDate = new Date(year, month, day)
    const formattedDate = selectedDate.toISOString().split("T")[0]
    onChange(formattedDate)
    if (onClose) {
      onClose()
    }
  }

  const isCurrentMonth = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  const isSelectedDate = (day: number) => {
    if (!value) return false

    const selectedDate = new Date(value)
    return day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()
  }

  return (
    <div className="bg-white rounded-lg p-4 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-xl font-medium">
          {monthNames[month]} {year}
        </h3>
        <Button variant="outline" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center font-medium py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: adjustedFirstDay }).map((_, index) => (
          <div key={`empty-${index}`} className="h-12"></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1
          const date = new Date(year, month, day)
          const isToday = isCurrentMonth(date)
          const isSelected = isSelectedDate(day)

          return (
            <Button
              key={day}
              variant={isSelected ? "default" : isToday ? "secondary" : "outline"}
              className="h-12 text-lg"
              onClick={() => handleDayClick(day)}
            >
              {day}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

