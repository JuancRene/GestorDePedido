export default function Default() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h2 className="text-2xl font-bold mb-4">Página no encontrada</h2>
      <p className="mb-6 text-gray-600">No pudimos encontrar la página que estás buscando.</p>
      <a href="/" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
        Volver al inicio
      </a>
    </div>
  )
}

