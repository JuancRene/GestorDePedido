"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PenLine, Trash2, Users, Phone, MapPin } from "lucide-react"
import { ClientModal } from "./client-modal"
import { DeleteConfirmation } from "../components/delete-confirmation"
import { getClients, deleteClient, type Client } from "@/lib/clients"
import { toast } from "@/hooks/use-toast"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"

export function ClientsSection() {
  const [initialClients, setInitialClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Usar el hook de suscripción en tiempo real para clientes
  const { data: clients } = useRealtimeSubscription<Client>("customers", initialClients, {
    onInsert: (newClient) => {
      toast({
        title: "Nuevo cliente",
        description: `Se ha registrado un nuevo cliente: ${newClient.name}`,
      })
    },
    onUpdate: (updatedClient) => {
      toast({
        title: "Cliente actualizado",
        description: `Se ha actualizado la información de ${updatedClient.name}`,
      })
    },
    onDelete: (deletedId) => {
      toast({
        title: "Cliente eliminado",
        description: `Se ha eliminado un cliente`,
      })
      // Asegurarse de que la UI se actualice inmediatamente
      setInitialClients((prev) => prev.filter((client) => client.id !== deletedId))
    },
  })

  const fetchClients = async () => {
    setIsLoading(true)
    try {
      const data = await getClients()
      setInitialClients(data)
    } catch (error) {
      console.error("Error fetching clients:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setIsClientModalOpen(true)
  }

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteClient = async () => {
    if (!selectedClient) return

    setIsDeleting(true)
    try {
      const result = await deleteClient(selectedClient.id)
      if (result.success) {
        toast({
          title: "Cliente eliminado",
          description: "El cliente ha sido eliminado exitosamente.",
        })
        // No need to fetch clients again, the real-time subscription will handle it
      } else {
        toast({
          title: "No se pudo eliminar el cliente",
          description: result.message || "Ocurrió un error al eliminar el cliente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting client:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery) ||
      client.address.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            <h1 className="text-2xl font-semibold">Clientes</h1>
          </div>
          <p className="text-sm text-gray-500">Gestione la información de sus clientes</p>
        </div>
        <div className="flex items-center gap-4">
          <Input
            type="search"
            placeholder="Buscar clientes..."
            className="w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            className="bg-red-500 hover:bg-red-600"
            onClick={() => {
              setSelectedClient(null)
              setIsClientModalOpen(true)
            }}
          >
            + Nuevo Cliente
          </Button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" />
          <h2 className="text-lg font-medium">Directorio de Clientes</h2>
          <span className="text-sm text-gray-500">{filteredClients.length} clientes en total</span>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Cargando clientes...</div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg border">
            {searchQuery ? "No se encontraron clientes con esa búsqueda." : "No hay clientes registrados."}
          </div>
        ) : (
          <div className="bg-white rounded-lg border">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Nombre</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Teléfono</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Dirección</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Pedidos</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{client.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {client.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        {client.address}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="font-normal bg-gray-100 text-black hover:bg-gray-100">
                        {client.orders} pedidos
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditClient(client)}
                        >
                          <PenLine className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600"
                          onClick={() => handleDeleteClient(client)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isClientModalOpen && (
        <ClientModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          client={selectedClient || undefined}
          onSuccess={fetchClients}
        />
      )}

      {isDeleteDialogOpen && selectedClient && (
        <DeleteConfirmation
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDeleteClient}
          title="Eliminar Cliente"
          description={`¿Está seguro que desea eliminar al cliente "${selectedClient.name}"? Esta acción no se puede deshacer.`}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}

