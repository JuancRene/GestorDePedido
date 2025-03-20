"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { createClient } from "@/lib/supabase-browser"
import { debounce } from "lodash"

// Hook genérico para suscripciones en tiempo real
export function useRealtimeSubscription<T>(
  table: string,
  initialData: T[],
  options?: {
    filter?: string
    filterValue?: any
    onInsert?: (item: T) => void
    onUpdate?: (item: T) => void
    onDelete?: (id: number) => void
    orderBy?: string
    orderDirection?: "asc" | "desc"
    limit?: number
  },
) {
  const [data, setData] = useState<T[]>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Actualizar datos cuando cambia initialData
  useEffect(() => {
    setData(initialData)
  }, [initialData])

  // Debounce para actualizaciones de estado
  const debouncedSetData = useMemo(
    () =>
      debounce((newData: T[]) => {
        setData(newData)
        setLastUpdated(new Date())
      }, 100),
    [],
  )

  // Optimizar la configuración de suscripción
  const subscriptionSetup = useCallback(() => {
    const supabase = createClient()

    // Pre-filtrar datos en el servidor
    const filterQuery =
      options?.filter && options?.filterValue ? `${options.filter}=eq.${options.filterValue}` : undefined

    const channel = supabase
      .channel(`${table}-changes-${Math.random()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
          filter: filterQuery,
        },
        (payload) => {
          // Actualizaciones optimistas
          if (payload.eventType === "INSERT") {
            const newItem = payload.new as T
            setData((prev) => {
              // Ordenar si es necesario
              const newData = [newItem, ...prev]
              if (options?.orderBy) {
                return sortData(newData, options.orderBy, options.orderDirection || "desc")
              }
              return newData
            })

            if (options?.onInsert) {
              options.onInsert(newItem)
            }
          }

          if (payload.eventType === "UPDATE") {
            const updatedItem = payload.new as T
            setData((prev) =>
              prev.map((item) =>
                // @ts-ignore
                item.id === updatedItem.id ? updatedItem : item,
              ),
            )

            if (options?.onUpdate) {
              options.onUpdate(updatedItem)
            }
          }

          if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id as number
            // Asegurarse de que la eliminación se refleje inmediatamente
            setData((prev) =>
              // @ts-ignore
              prev.filter((item) => item.id !== deletedId),
            )

            if (options?.onDelete) {
              options.onDelete(deletedId)
            }
          }

          // Actualizar timestamp para indicar cambios
          setLastUpdated(new Date())
        },
      )
      .subscribe((status) => {
        console.log(`Subscription status for ${table}: ${status}`)
      })

    return () => {
      debouncedSetData.cancel()
      supabase.removeChannel(channel)
    }
  }, [table, options, debouncedSetData])

  // Configurar suscripción
  useEffect(() => {
    return subscriptionSetup()
  }, [subscriptionSetup])

  // Función para ordenar datos
  const sortData = (dataToSort: T[], orderBy: string, direction: "asc" | "desc") => {
    return [...dataToSort].sort((a, b) => {
      // @ts-ignore
      const valueA = a[orderBy]
      // @ts-ignore
      const valueB = b[orderBy]

      if (direction === "asc") {
        return valueA > valueB ? 1 : -1
      } else {
        return valueA < valueB ? 1 : -1
      }
    })
  }

  // Datos optimizados con memoización
  const optimizedData = useMemo(() => {
    // Aplicar límite si está configurado
    if (options?.limit && data.length > options.limit) {
      return data.slice(0, options.limit)
    }
    return data
  }, [data, options?.limit])

  return {
    data: optimizedData,
    isLoading,
    error,
    setData,
    lastUpdated,
  }
}

