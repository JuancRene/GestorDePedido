"use client"

import { useState, useEffect } from "react"

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Estado para almacenar nuestro valor
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Inicializar con el valor almacenado o el valor inicial
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const item = window.localStorage.getItem(key)
        setStoredValue(item ? JSON.parse(item) : initialValue)
      }
    } catch (error) {
      console.error(error)
      setStoredValue(initialValue)
    }
  }, [key, initialValue])

  // Función para actualizar el valor en localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Permitir que el valor sea una función para seguir el mismo patrón que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value

      // Guardar el estado
      setStoredValue(valueToStore)

      // Guardar en localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue] as const
}

