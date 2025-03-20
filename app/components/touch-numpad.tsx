"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Delete } from "lucide-react"

interface TouchNumpadProps {
  value: string
  onChange: (value: string) => void
  onClose?: () => void
  allowDecimal?: boolean
  maxValue?: number
  title?: string
}

export function TouchNumpad({
  value,
  onChange,
  onClose,
  allowDecimal = false,
  maxValue,
  title = "Ingrese cantidad",
}: TouchNumpadProps) {
  const [displayValue, setDisplayValue] = useState(value)

  const handleNumberClick = (num: string) => {
    const newValue = displayValue === "0" ? num : displayValue + num

    // Validate against max value if provided
    if (maxValue !== undefined && Number(newValue) > maxValue) {
      return
    }

    setDisplayValue(newValue)
    onChange(newValue)
  }

  const handleDecimalClick = () => {
    if (!allowDecimal || displayValue.includes(".")) return

    const newValue = displayValue + "."
    setDisplayValue(newValue)
    onChange(newValue)
  }

  const handleDeleteClick = () => {
    if (displayValue.length <= 1) {
      setDisplayValue("0")
      onChange("0")
      return
    }

    const newValue = displayValue.slice(0, -1)
    setDisplayValue(newValue)
    onChange(newValue)
  }

  const handleClearClick = () => {
    setDisplayValue("0")
    onChange("0")
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-xs">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">{title}</h3>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="bg-gray-100 p-3 rounded-md mb-4 text-right">
        <span className="text-2xl font-medium">{displayValue}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
          <Button
            key={num}
            variant="outline"
            className="h-14 text-xl font-medium"
            onClick={() => handleNumberClick(num.toString())}
          >
            {num}
          </Button>
        ))}

        <Button variant="outline" className="h-14 text-xl font-medium" onClick={handleClearClick}>
          C
        </Button>

        <Button variant="outline" className="h-14 text-xl font-medium" onClick={() => handleNumberClick("0")}>
          0
        </Button>

        {allowDecimal ? (
          <Button
            variant="outline"
            className="h-14 text-xl font-medium"
            onClick={handleDecimalClick}
            disabled={displayValue.includes(".")}
          >
            .
          </Button>
        ) : (
          <Button variant="outline" className="h-14 text-xl font-medium" onClick={handleDeleteClick}>
            <Delete className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  )
}

