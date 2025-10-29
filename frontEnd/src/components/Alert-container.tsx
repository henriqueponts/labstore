// Arquivo: src/components/Alert-container.tsx - OTIMIZADO

"use client"

import { createContext, useContext, useState, type ReactNode, useCallback, useMemo } from "react" // 1. Importe useCallback e useMemo
import { Alert } from "./Alerts"

type AlertType = "sucesso" | "erro" | "aviso"

interface AlertData {
  id: string
  type: AlertType
  title: string
  message?: string
  autoClose?: boolean
}

interface AlertContextType {
  showAlert: (type: AlertType, title: string, message?: string, autoClose?: boolean) => void
  showSucesso: (title: string, message?: string) => void
  showErro: (title: string, message?: string) => void
  showAviso: (title: string, message?: string) => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertData[]>([])

  // 2. Envolva todas as funções que mudam o estado com useCallback.
  // A dependência vazia [] significa que a função NUNCA será recriada.
  const showAlert = useCallback((type: AlertType, title: string, message?: string, autoClose = true) => {
    const id = Math.random().toString(36).substring(7)
    setAlerts((prev) => [...prev, { id, type, title, message, autoClose }])
  }, [])

  const showSucesso = useCallback((title: string, message?: string) => {
    showAlert("sucesso", title, message, true)
  }, [showAlert])

  const showErro = useCallback((title: string, message?: string) => {
    showAlert("erro", title, message, true)
  }, [showAlert])

  const showAviso = useCallback((title: string, message?: string) => {
    showAlert("aviso", title, message, true)
  }, [showAlert])

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id))
  }, [])

  // 3. Memorize o objeto de valor do contexto com useMemo.
  // Ele só será recalculado se uma das funções (que são estáveis) mudar.
  const value = useMemo(() => ({
    showAlert,
    showSucesso,
    showErro,
    showAviso,
  }), [showAlert, showSucesso, showErro, showAviso])

  return (
    // O objeto 'value' agora é estável. React verá que ele não mudou
    // e não irá re-renderizar os {children} desnecessariamente.
    <AlertContext.Provider value={value}>
      {children}

      {/* O container de alertas em si continua funcionando normalmente, */}
      {/* pois ele lê o estado 'alerts' diretamente neste componente. */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
        <div className="pointer-events-auto space-y-3">
          {alerts.map((alert) => (
            <Alert
              key={alert.id}
              type={alert.type}
              title={alert.title}
              message={alert.message}
              autoClose={alert.autoClose}
              onClose={() => removeAlert(alert.id)}
            />
          ))}
        </div>
      </div>
    </AlertContext.Provider>
  )
}

export function useAlert() {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error("useAlert deve ser usado dentro de um AlertProvider")
  }
  return context
}