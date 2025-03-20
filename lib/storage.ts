// Implementación segura de localStorage para entornos cliente y servidor

// Interfaz para el almacenamiento
interface StorageInterface {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  clear(): void
}

// Implementación para el cliente (navegador)
class BrowserStorage implements StorageInterface {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.error("Error accessing localStorage:", error)
      return null
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.error("Error writing to localStorage:", error)
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error("Error removing from localStorage:", error)
    }
  }

  clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.error("Error clearing localStorage:", error)
    }
  }
}

// Implementación para el servidor (no hace nada)
class ServerStorage implements StorageInterface {
  getItem(_key: string): string | null {
    return null
  }

  setItem(_key: string, _value: string): void {
    // No hace nada en el servidor
  }

  removeItem(_key: string): void {
    // No hace nada en el servidor
  }

  clear(): void {
    // No hace nada en el servidor
  }
}

// Exportamos la implementación adecuada según el entorno
export const storage: StorageInterface = typeof window !== "undefined" ? new BrowserStorage() : new ServerStorage()

