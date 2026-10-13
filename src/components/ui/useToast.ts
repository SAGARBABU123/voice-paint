import { createContext, useContext } from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export type ToastOptions = {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

export type ToastContextValue = {
  show: (options: ToastOptions) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a <ToastProvider>')
  return context
}
