import RoleGuard from "@/components/role-guard"

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Panel de Administración</h1>
        <p>Bienvenido al panel de administración. Aquí puedes gestionar todos los aspectos del sistema.</p>
      </div>
    </RoleGuard>
  )
}

