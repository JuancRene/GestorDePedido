"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { getClients } from "@/lib/clients"
import type { Customer } from "@/types/order"

interface ClientSearchProps {
  onSelect: (client: Customer) => void
  onCreateNew: (searchValue: string) => void
}

export function ClientSearch({ onSelect, onCreateNew }: ClientSearchProps) {
  const [searchValue, setSearchValue] = React.useState("")
  const [clients, setClients] = React.useState<Customer[]>([])
  const [showResults, setShowResults] = React.useState(false)
  const resultsRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Cargar clientes al montar el componente
  React.useEffect(() => {
    const loadClients = async () => {
      const data = await getClients()
      setClients(data)
    }
    loadClients()
  }, [])

  // Cerrar resultados al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Filtrar clientes basado en la búsqueda
  const filteredClients = React.useMemo(() => {
    if (!searchValue) return []
    const search = searchValue.toLowerCase()
    return clients.filter((client) => client.name.toLowerCase().includes(search) || client.phone.includes(search))
  }, [clients, searchValue])

  const handleSelect = (client: Customer) => {
    onSelect(client)
    setSearchValue(`${client.name} - ${client.phone}`)
    setShowResults(false)
  }

  const handleCreateNew = () => {
    onCreateNew(searchValue)
  }

  return (
    <div className="relative">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            placeholder="Escriba el nombre del cliente..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value)
              setShowResults(true)
            }}
            onFocus={() => setShowResults(true)}
            className="w-full bg-white"
          />
        </div>
        <Button onClick={handleCreateNew} className="bg-red-600 hover:bg-red-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {showResults && filteredClients.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          <ul className="py-1">
            {filteredClients.map((client) => (
              <li
                key={client.id}
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSelect(client)}
              >
                <div className="font-medium">{client.name}</div>
                <div className="text-sm text-gray-500">{client.phone}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

