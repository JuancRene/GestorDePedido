"use client"

import { useState, useEffect } from "react"
import { storage } from "@/lib/storage"

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Estado para almacenar nuestro valor
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Inicializar el estado con el valor de localStorage
  useEffect(() => {
    try {
      const item = storage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
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

      // Guardar en el estado
      setStoredValue(valueToStore)

      // Guardar en localStorage
      storage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(error)
    }
  }

  return [storedValue, setValue] as const
}

