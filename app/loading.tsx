export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="w-12 h-12 border-4 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600">Cargando...</p>
    </div>
  )
}

