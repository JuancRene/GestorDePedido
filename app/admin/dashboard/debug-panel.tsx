"use client"

interface DebugPanelProps {
  data: any
}

export function DebugPanel({ data }: DebugPanelProps) {
  // Always return null in production
  if (process.env.NODE_ENV === "production") return null

  // In development, don't show anything by default
  return null

  /* Original debug panel code - commented out
  return (
    <div className="fixed bottom-4 right-4 max-w-lg max-h-96 overflow-auto bg-black/90 text-white p-4 rounded-lg text-xs font-mono">
      <h3 className="text-sm font-bold mb-2">Debug Data:</h3>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
  */
}

