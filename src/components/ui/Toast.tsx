import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { cn } from './cn'
import { Icon, type IconName } from './Icon'
import { ToastContext, type ToastOptions, type ToastVariant } from './useToast'

type ToastData = ToastOptions & {
  id: number
  variant: NonNullable<ToastOptions['variant']>
}

let nextId = 1

const VARIANT_ICON: Record<ToastVariant, IconName> = {
  success: 'check',
  error: 'alert',
  info: 'info',
}

/**
 * Compact bottom-right toast viewport (Vault pattern: transparent, transient
 * feedback — never a full-width banner). Auto-dismisses; always closeable.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback(
    (options: ToastOptions) => {
      const id = nextId++
      const variant = options.variant ?? 'info'
      setToasts((current) => [...current, { ...options, id, variant }])
      window.setTimeout(() => dismiss(id), options.duration ?? 4500)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="vault-toast-viewport" aria-live="polite" aria-label="Notifications">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              'vault-toast',
              toast.variant === 'error' && 'vault-toast--error',
              toast.variant === 'success' && 'vault-toast--success',
              toast.variant === 'info' && 'vault-toast--info',
            )}
          >
            <Icon name={VARIANT_ICON[toast.variant]} className="vault-toast__icon" />
            <div className="min-w-0 flex-1">
              <p className="vault-toast__title">{toast.title}</p>
              {toast.description ? <p className="vault-toast__desc">{toast.description}</p> : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              className="vault-toast__close"
              onClick={() => dismiss(toast.id)}
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
