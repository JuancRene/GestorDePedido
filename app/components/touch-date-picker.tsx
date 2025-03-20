"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { logger } from "@/lib/logger"
import { sendSyncEvent } from "@/lib/realtime-sync"

const MODULE = "touch-date-picker"

interface TouchDatePickerProps {
  isOpen: boolean
  onClose: () => void
  value: string
  onChange: (value: string) => void
}

export function TouchDatePicker({ isOpen, onClose, value, onChange }: TouchDatePickerProps) {
  // Inicializar con la fecha actual si no hay valor
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date()
    return {
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
    }
  })

  // Actualizar cuando cambia el valor
  useEffect(() => {
    if (value) {
      try {
        const parts = value.split("-")
        if (parts.length === 3) {
          const year = Number.parseInt(parts[0])
          const month = Number.parseInt(parts[1]) - 1 // Meses en JS son 0-indexed
          const day = Number.parseInt(parts[2])

          logger.debug(MODULE, "Actualizando fecha desde prop value", { value, year, month, day })

          setCurrentDate({ year, month, day })
        }
      } catch (error) {
        logger.error(MODULE, "Error al parsear fecha", { value, error })
      }
    }
  }, [value])

  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      if (prev.month === 0) {
        return { ...prev, month: 11, year: prev.year - 1 }
      }
      return { ...prev, month: prev.month - 1 }
    })
  }

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      if (prev.month === 11) {
        return { ...prev, month: 0, year: prev.year + 1 }
      }
      return { ...prev, month: prev.month + 1 }
    })
  }

  const handlePrevYear = () => {
    setCurrentDate((prev) => ({ ...prev, year: prev.year - 1 }))
  }

  const handleNextYear = () => {
    setCurrentDate((prev) => ({ ...prev, year: prev.year + 1 }))
  }

  const handleSelectDate = (day: number) => {
    // Crear la fecha seleccionada
    const selectedYear = currentDate.year
    const selectedMonth = currentDate.month + 1 // Convertir a 1-indexed para el formato
    const selectedDay = day

    // Formatear la fecha manualmente para evitar problemas de zona horaria
    const formattedDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`

    logger.debug(MODULE, "Fecha seleccionada", {
      selectedYear,
      selectedMonth,
      selectedDay,
      formattedDate,
    })

    // Enviar evento de sincronización
    sendSyncEvent("DATE_FORMAT_UPDATE", {
      date: formattedDate,
      formattedDate: `${String(selectedDay).padStart(2, "0")}/${String(selectedMonth).padStart(2, "0")}/${selectedYear}`,
    }).catch((error) => {
      console.error("Error al enviar evento de sincronización:", error)
    })

    onChange(formattedDate)
    onClose()
  }

  // Calcular días en el mes actual
  const daysInMonth = new Date(currentDate.year, currentDate.month + 1, 0).getDate()

  // Calcular el primer día del mes (0 = domingo, 1 = lunes, etc.)
  const firstDayOfMonth = new Date(currentDate.year, currentDate.month, 1).getDay()

  // Ajustar para que la semana comience en lunes (0 = lunes, 6 = domingo)
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

  // Verificar si un día está seleccionado
  const isDaySelected = (day: number) => {
    if (!value) return false

    try {
      const parts = value.split("-")
      if (parts.length === 3) {
        return (
          Number.parseInt(parts[0]) === currentDate.year &&
          Number.parseInt(parts[1]) - 1 === currentDate.month &&
          Number.parseInt(parts[2]) === day
        )
      }
    } catch (error) {
      return false
    }

    return false
  }

  // Verificar si un día es hoy
  const isToday = (day: number) => {
    const today = new Date()
    return today.getFullYear() === currentDate.year && today.getMonth() === currentDate.month && today.getDate() === day
  }

  // Obtener el nombre del mes actual
  const monthName = format(new Date(currentDate.year, currentDate.month), "MMMM", { locale: es })

  // Formatear la fecha seleccionada para mostrarla
  const getFormattedSelectedDate = () => {
    if (!value) return "Ninguna"

    try {
      // Crear la fecha manualmente para evitar problemas de zona horaria
      const parts = value.split("-")
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
    } catch (error) {
      return "Error en formato"
    }

    return value
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[350px] p-0">
        <div className="p-4">
          <div className="text-lg font-medium mb-4">Seleccionar fecha</div>

          {/* Año y mes */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handlePrevYear}>
                <ChevronLeft className="h-4 w-4" />
                <ChevronLeft className="h-4 w-4 -ml-3" />
              </Button>
              <span className="text-base w-16 text-center">{currentDate.year}</span>
              <Button variant="ghost" size="sm" onClick={handleNextYear}>
                <ChevronRight className="h-4 w-4" />
                <ChevronRight className="h-4 w-4 -ml-3" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-base w-24 text-center capitalize">{monthName}</span>
              <Button variant="ghost" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((day) => (
              <div key={day} className="text-center text-sm py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: adjustedFirstDay }).map((_, index) => (
              <div key={`empty-${index}`} className="h-9" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1
              const selected = isDaySelected(day)
              const today = isToday(day)

              return (
                <Button
                  key={day}
                  variant={selected ? "default" : today ? "secondary" : "ghost"}
                  className={`h-9 hover:bg-primary hover:text-primary-foreground ${
                    selected ? "bg-primary text-primary-foreground" : ""
                  }`}
                  onClick={() => handleSelectDate(day)}
                >
                  {day}
                </Button>
              )
            })}
          </div>

          {/* Mostrar la fecha seleccionada para depuración */}
          <div className="mt-4 text-sm text-gray-500">Fecha seleccionada: {getFormattedSelectedDate()}</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

