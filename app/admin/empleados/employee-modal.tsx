"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createEmployee, updateEmployee, type Employee, type EmployeeRole } from "@/lib/employees"
import { toast } from "@/hooks/use-toast"
import { AlertCircle, Eye, EyeOff } from "lucide-react"

interface EmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  employee?: Employee
  onSuccess: () => void
}

export function EmployeeModal({ isOpen, onClose, employee, onSuccess }: EmployeeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "empleado" as EmployeeRole,
    active: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!employee

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        username: employee.username,
        password: "",
        confirmPassword: "",
        role: employee.role,
        active: employee.active,
      })
    } else {
      setFormData({
        name: "",
        username: "",
        password: "",
        confirmPassword: "",
        role: "empleado",
        active: true,
      })
    }
    setErrors({})
  }, [employee, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Limpiar errores al cambiar el valor
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value as EmployeeRole }))
  }

  const handleActiveChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, active: checked }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio"
    }

    if (!formData.username.trim()) {
      newErrors.username = "El nombre de usuario es obligatorio"
    } else if (formData.username.includes(" ")) {
      newErrors.username = "El nombre de usuario no puede contener espacios"
    }

    if (!isEditing || formData.password) {
      if (!isEditing && !formData.password) {
        newErrors.password = "La contraseña es obligatoria"
      } else if (formData.password.length < 6) {
        newErrors.password = "La contraseña debe tener al menos 6 caracteres"
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      let result

      if (isEditing && employee) {
        // Solo enviar la contraseña si se ha modificado
        const updateData = {
          name: formData.name,
          username: formData.username,
          role: formData.role,
          active: formData.active,
          ...(formData.password ? { password: formData.password } : {}),
        }

        result = await updateEmployee(employee.id, updateData)
      } else {
        result = await createEmployee({
          name: formData.name,
          username: formData.username,
          password: formData.password,
          role: formData.role,
          active: formData.active,
        })
      }

      if (result.success) {
        toast({
          title: isEditing ? "Empleado actualizado" : "Empleado creado",
          description: isEditing
            ? "El empleado ha sido actualizado exitosamente."
            : "El empleado ha sido creado exitosamente.",
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: "Error",
          description:
            result.message ||
            (isEditing
              ? "No se pudo actualizar el empleado. Intente nuevamente."
              : "No se pudo crear el empleado. Intente nuevamente."),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Empleado" : "Nuevo Empleado"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.name}</span>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username">Nombre de usuario</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={errors.username ? "border-red-500" : ""}
              />
              {errors.username && (
                <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.username}</span>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">
                {isEditing ? "Nueva contraseña (dejar en blanco para mantener)" : "Contraseña"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.confirmPassword}</span>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Rol</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="cocina">Cocinero</SelectItem>
                  <SelectItem value="cajero">Cajero</SelectItem>
                  <SelectItem value="empleado">Empleado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active" className="cursor-pointer">
                Estado activo
              </Label>
              <Switch id="active" checked={formData.active} onCheckedChange={handleActiveChange} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
              {isSubmitting ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Empleado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

