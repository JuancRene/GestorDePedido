"use client"

import RoleGuard from "@/components/role-guard"

export default function EmployeePage() {
  return (
    <RoleGuard allowedRoles={["admin", "employee"]}>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Panel de Empleado</h1>
        <p>Bienvenido al panel de empleado. Aquí puedes gestionar los pedidos.</p>
      </div>
    </RoleGuard>
  )
}

