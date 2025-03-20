"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, ArrowLeft, ArrowUp } from "lucide-react"

interface TouchKeyboardProps {
  value: string
  onChange: (value: string) => void
  onClose?: () => void
  onSubmit?: () => void
  placeholder?: string
}

export function TouchKeyboard({
  value,
  onChange,
  onClose,
  onSubmit,
  placeholder = "Ingrese texto",
}: TouchKeyboardProps) {
  const [isUpperCase, setIsUpperCase] = useState(false)

  const rows = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ñ"],
    ["z", "x", "c", "v", "b", "n", "m", ",", ".", "-"],
  ]

  const handleKeyPress = (key: string) => {
    const char = isUpperCase ? key.toUpperCase() : key
    onChange(value + char)
  }

  const handleBackspace = () => {
    onChange(value.slice(0, -1))
  }

  const handleSpace = () => {
    onChange(value + " ")
  }

  const toggleCase = () => {
    setIsUpperCase(!isUpperCase)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Teclado</h3>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="bg-gray-100 p-3 rounded-md mb-4 min-h-[60px] flex items-center">
        {value ? (
          <span className="text-xl">{value}</span>
        ) : (
          <span className="text-xl text-gray-400">{placeholder}</span>
        )}
      </div>

      <div className="space-y-2">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-1 justify-center">
            {row.map((key) => (
              <Button
                key={key}
                variant="outline"
                className="h-12 w-12 text-lg font-medium"
                onClick={() => handleKeyPress(key)}
              >
                {isUpperCase ? key.toUpperCase() : key}
              </Button>
            ))}
          </div>
        ))}

        <div className="flex gap-1 justify-center">
          <Button variant="outline" className="h-12 px-4 text-sm font-medium" onClick={toggleCase}>
            <ArrowUp className="h-5 w-5 mr-1" />
            {isUpperCase ? "abc" : "ABC"}
          </Button>

          <Button variant="outline" className="h-12 flex-1 text-sm font-medium" onClick={handleSpace}>
            Espacio
          </Button>

          <Button variant="outline" className="h-12 px-4 text-sm font-medium" onClick={handleBackspace}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {onSubmit && (
            <Button className="h-12 px-4 text-sm font-medium bg-primary" onClick={onSubmit}>
              Aceptar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

