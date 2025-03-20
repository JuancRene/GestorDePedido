"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PenLine, Trash2, Users, Key, Database } from "lucide-react"
import { EmployeeModal } from "./employee-modal"
import { DeleteConfirmation } from "../components/delete-confirmation"
import { getEmployees, deleteEmployee, type Employee, type EmployeeRole } from "@/lib/employees"
import { toast } from "@/hooks/use-toast"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"

export function EmployeesSection() {
  const [initialEmployees, setInitialEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [tableError, setTableError] = useState<string | null>(null)

  // Usar el hook de suscripción en tiempo real para empleados
  const { data: employees } = useRealtimeSubscription<Employee>("employees", initialEmployees, {
    onInsert: (newEmployee) => {
      toast({
        title: "Nuevo empleado",
        description: `Se ha registrado un nuevo empleado: ${newEmployee.name}`,
      })
    },
    onUpdate: (updatedEmployee) => {
      toast({
        title: "Empleado actualizado",
        description: `Se ha actualizado la información de ${updatedEmployee.name}`,
      })
    },
    onDelete: (deletedId) => {
      toast({
        title: "Empleado eliminado",
        description: `Se ha eliminado un empleado`,
      })
    },
  })

  const fetchEmployees = async () => {
    setIsLoading(true)
    setTableError(null)
    try {
      const data = await getEmployees()
      setInitialEmployees(data)
    } catch (error) {
      console.error("Error fetching employees:", error)
      setTableError("No se pudo acceder a la tabla de empleados. Es posible que la tabla no exista.")
      toast({
        title: "Error",
        description: "No se pudieron cargar los empleados. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  // Actualiza la función handleEditEmployee para que pase correctamente los datos al modal
  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsEmployeeModalOpen(true)
  }

  const handleDeleteEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsDeleteDialogOpen(true)
  }

  // Actualiza la función confirmDeleteEmployee para que maneje correctamente los errores
  const confirmDeleteEmployee = async () => {
    if (!selectedEmployee) return

    setIsDeleting(true)
    try {
      const result = await deleteEmployee(selectedEmployee.id)
      if (result.success) {
        toast({
          title: "Empleado eliminado",
          description: "El empleado ha sido eliminado exitosamente.",
        })
        // No need to fetch employees again, the real-time subscription will handle it
      } else {
        toast({
          title: "No se pudo eliminar el empleado",
          description: result.message || "Ocurrió un error al eliminar el empleado.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting employee:", error)
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

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Función para obtener el color y texto del rol
  const getRoleBadge = (role: EmployeeRole) => {
    switch (role) {
      case "admin":
        return { color: "bg-black text-white", text: "Administrador" }
      case "cocina":
        return { color: "bg-red-600 text-white", text: "Cocinero" }
      case "cajero":
        return { color: "bg-gray-800 text-white", text: "Cajero" }
      case "empleado":
        return { color: "bg-gray-100 text-black", text: "Empleado" }
      default:
        return { color: "bg-gray-100 text-black", text: role }
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            <h1 className="text-2xl font-semibold">Empleados</h1>
          </div>
          <p className="text-sm text-gray-500">Gestione los empleados y sus credenciales de acceso</p>
        </div>
        <div className="flex items-center gap-4">
          <Input
            type="search"
            placeholder="Buscar empleados..."
            className="w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => {
              setSelectedEmployee(null)
              setIsEmployeeModalOpen(true)
            }}
          >
            + Nuevo Empleado
          </Button>
        </div>
      </div>

      {tableError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Database className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Error de base de datos</h3>
              <p className="text-red-700 mt-1">{tableError}</p>
              <div className="mt-3 bg-white p-4 rounded border border-red-100 text-sm">
                <p className="font-medium mb-2">
                  Para crear la tabla de empleados, ejecuta el siguiente SQL en la consola de Supabase:
                </p>
                <pre className="bg-gray-50 p-3 rounded overflow-x-auto text-xs">
                  {`-- Crear la tabla de empleados
CREATE TABLE IF NOT EXISTS public.employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'cocina', 'empleado', 'cajero')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_employees_username ON public.employees(username);
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);

-- Insertar un administrador por defecto (contraseña: admin123)
INSERT INTO public.employees (name, username, password_hash, role, active)
VALUES (
  'Administrador', 
  'admin', 
  'YWRtaW4xMjNzYWx0X3ZhbHVl', -- Hash simple de 'admin123'
  'admin', 
  true
)
ON CONFLICT (username) DO NOTHING;

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir acceso a todos los registros
CREATE POLICY "Allow full access to all users" ON public.employees
  USING (true)
  WITH CHECK (true);`}
                </pre>
                <Button className="mt-3 bg-red-600 hover:bg-red-700 text-white" onClick={fetchEmployees}>
                  Reintentar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" />
          <h2 className="text-lg font-medium">Listado de Empleados</h2>
          <span className="text-sm text-gray-500">{filteredEmployees.length} empleados en total</span>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Cargando empleados...</div>
        ) : filteredEmployees.length === 0 && !tableError ? (
          <div className="text-center py-8 bg-white rounded-lg border">
            {searchQuery ? "No se encontraron empleados con esa búsqueda." : "No hay empleados registrados."}
          </div>
        ) : (
          !tableError && (
            <div className="bg-white rounded-lg border">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Nombre</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Usuario</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Rol</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Estado</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredEmployees.map((employee) => {
                    const roleBadge = getRoleBadge(employee.role)

                    return (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">{employee.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-gray-400" />
                            {employee.username}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${roleBadge.color}`}>{roleBadge.text}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={employee.active ? "default" : "outline"}
                            className={employee.active ? "bg-black text-white" : "text-gray-500"}
                          >
                            {employee.active ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditEmployee(employee)}
                            >
                              <PenLine className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600"
                              onClick={() => handleDeleteEmployee(employee)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {isEmployeeModalOpen && (
        <EmployeeModal
          isOpen={isEmployeeModalOpen}
          onClose={() => setIsEmployeeModalOpen(false)}
          employee={selectedEmployee || undefined}
          onSuccess={fetchEmployees}
        />
      )}

      {isDeleteDialogOpen && selectedEmployee && (
        <DeleteConfirmation
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDeleteEmployee}
          title="Eliminar Empleado"
          description={`¿Está seguro que desea eliminar al empleado "${selectedEmployee.name}"? Esta acción no se puede deshacer.`}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}

