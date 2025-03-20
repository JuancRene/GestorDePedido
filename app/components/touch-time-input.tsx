"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock } from "lucide-react"
import { TouchNumpad } from "./touch-numpad"

interface TouchTimeInputProps {
  isOpen: boolean
  onClose: () => void
  value: string
  onChange: (value: string) => void
  title?: string
}

export function TouchTimeInput({ isOpen, onClose, value, onChange, title = "Ingresar hora" }: TouchTimeInputProps) {
  const [hours, setHours] = useState(() => {
    return value ? value.split(":")[0] : ""
  })
  const [minutes, setMinutes] = useState(() => {
    return value ? value.split(":")[1] : ""
  })
  const [isEnteringMinutes, setIsEnteringMinutes] = useState(false)

  const handleHourChange = (newHour: string) => {
    const hourNum = Number.parseInt(newHour)
    if (hourNum >= 0 && hourNum <= 23) {
      setHours(newHour.padStart(2, "0"))
      if (newHour.length === 2) {
        setIsEnteringMinutes(true)
      }
    }
  }

  const handleMinuteChange = (newMinute: string) => {
    const minuteNum = Number.parseInt(newMinute)
    if (minuteNum >= 0 && minuteNum <= 59) {
      setMinutes(newMinute.padStart(2, "0"))
      if (newMinute.length === 2) {
        const timeString = `${hours}:${newMinute.padStart(2, "0")}`
        onChange(timeString)
        onClose()
      }
    }
  }

  const handleBack = () => {
    if (isEnteringMinutes) {
      setIsEnteringMinutes(false)
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[350px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          <div className="text-center mb-4">
            <div className="text-4xl font-bold font-mono">
              {hours || "--"}:{minutes || "--"}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {isEnteringMinutes ? "Ingrese los minutos" : "Ingrese la hora"}
            </div>
          </div>

          <TouchNumpad
            value={isEnteringMinutes ? minutes : hours}
            onChange={isEnteringMinutes ? handleMinuteChange : handleHourChange}
            maxValue={isEnteringMinutes ? 59 : 23}
            allowDecimal={false}
          />

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={handleBack}>
              {isEnteringMinutes ? "Volver a hora" : "Cancelar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

