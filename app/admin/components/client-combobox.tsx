"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getClients } from "@/lib/clients"
import type { Customer } from "@/types/order"

interface ClientComboboxProps {
  onSelect: (client: Customer | null) => void
  onCreateNew: (searchValue: string) => void
}

export function ClientCombobox({ onSelect, onCreateNew }: ClientComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const [clients, setClients] = React.useState<Customer[]>([])
  const [selectedClient, setSelectedClient] = React.useState<Customer | null>(null)

  // Cargar clientes al montar el componente
  React.useEffect(() => {
    const loadClients = async () => {
      const data = await getClients()
      setClients(data)
    }
    loadClients()
  }, [])

  // Filtrar clientes basado en la búsqueda
  const filteredClients = React.useMemo(() => {
    if (!searchValue) return clients
    const search = searchValue.toLowerCase()
    return clients.filter((client) => client.name.toLowerCase().includes(search) || client.phone.includes(search))
  }, [clients, searchValue])

  const handleSelect = (client: Customer) => {
    setSelectedClient(client)
    setOpen(false)
    onSelect(client)
  }

  const handleCreateNew = () => {
    onCreateNew(searchValue)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedClient ? (
            <span>
              {selectedClient.name} - {selectedClient.phone}
            </span>
          ) : (
            "Seleccionar cliente..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar cliente..." value={searchValue} onValueChange={setSearchValue} />
          <CommandList>
            <CommandEmpty className="py-2">
              <div className="px-2 py-1.5">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={handleCreateNew}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear nuevo cliente: {searchValue}
                </Button>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredClients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`${client.name}-${client.phone}`}
                  onSelect={() => handleSelect(client)}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", selectedClient?.id === client.id ? "opacity-100" : "opacity-0")}
                  />
                  <div className="flex flex-col">
                    <span>{client.name}</span>
                    <span className="text-sm text-gray-500">{client.phone}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

