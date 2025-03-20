"use client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock } from "lucide-react"

interface TouchTimePickerProps {
  isOpen: boolean
  onClose: () => void
  value: string
  onChange: (value: string) => void
  title?: string
}

export function TouchTimePicker({
  isOpen,
  onClose,
  value,
  onChange,
  title = "Seleccionar hora",
}: TouchTimePickerProps) {
  // Generate time slots every 15 minutes
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        slots.push(time)
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  const handleSelectTime = (time: string) => {
    onChange(time)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.map((time) => (
              <Button
                key={time}
                variant={value === time ? "default" : "outline"}
                className="h-12 text-lg"
                onClick={() => handleSelectTime(time)}
              >
                {time}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

