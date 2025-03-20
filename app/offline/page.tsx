"use client"

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Sin conexión</h1>
      <p className="mb-6">No tienes conexión a internet. Algunas funciones pueden no estar disponibles.</p>
      <p>La aplicación funcionará con datos almacenados localmente hasta que se restablezca la conexión.</p>
      <button
        onClick={() => (window.location.href = "/")}
        className="mt-6 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 transition-colors"
      >
        Intentar nuevamente
      </button>
    </div>
  )
}

