const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
}

// Configuración del nivel de log (se puede cambiar dinámicamente)
let currentLogLevel = LOG_LEVELS.DEBUG

// Función para formatear la fecha y hora
const formatTimestamp = () => {
  return new Date().toISOString()
}

// Función para formatear el mensaje de log
const formatLogMessage = (level: string, module: string, message: string, data?: any) => {
  const timestamp = formatTimestamp()
  const dataString = data ? JSON.stringify(data) : ""
  return `[${timestamp}] [${level}] [${module}] ${message} ${dataString}`
}

// Función para guardar el log en localStorage (para debugging)
const saveToLocalStorage = (level: string, module: string, message: string, data?: any) => {
  try {
    const logs = JSON.parse(localStorage.getItem("app_logs") || "[]")
    logs.push({
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
    })

    // Limitar a los últimos 100 logs para no llenar el localStorage
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100)
    }

    localStorage.setItem("app_logs", JSON.stringify(logs))
  } catch (error) {
    console.error("Error saving log to localStorage:", error)
  }
}

// Exportar el objeto logger
export const logger = {
  // Establecer el nivel de log
  setLogLevel: (level: "DEBUG" | "INFO" | "WARN" | "ERROR") => {
    currentLogLevel = LOG_LEVELS[level]
  },

  // Métodos de log
  debug: (module: string, message: string, data?: any) => {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
      const formattedMessage = formatLogMessage("DEBUG", module, message, data)
      console.debug(formattedMessage)
      saveToLocalStorage("DEBUG", module, message, data)
    }
  },

  info: (module: string, message: string, data?: any) => {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      const formattedMessage = formatLogMessage("INFO", module, message, data)
      console.info(formattedMessage)
      saveToLocalStorage("INFO", module, message, data)
    }
  },

  warn: (module: string, message: string, data?: any) => {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
      const formattedMessage = formatLogMessage("WARN", module, message, data)
      console.warn(formattedMessage)
      saveToLocalStorage("WARN", module, message, data)
    }
  },

  error: (module: string, message: string, data?: any) => {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
      const formattedMessage = formatLogMessage("ERROR", module, message, data)
      console.error(formattedMessage)
      saveToLocalStorage("ERROR", module, message, data)
    }
  },

  // Obtener todos los logs almacenados
  getLogs: () => {
    try {
      return JSON.parse(localStorage.getItem("app_logs") || "[]")
    } catch (error) {
      console.error("Error getting logs from localStorage:", error)
      return []
    }
  },

  // Limpiar todos los logs
  clearLogs: () => {
    localStorage.removeItem("app_logs")
  },
}

