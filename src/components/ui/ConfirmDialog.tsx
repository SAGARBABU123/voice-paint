import { useEffect, useRef, type ReactNode } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { Icon } from './Icon'

type ConfirmDialogProps = {
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/** Accessible destructive confirmation dialog (Vault modal + alert pattern). */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useFocusTrap(dialogRef, onCancel)

  useEffect(() => {
    confirmRef.current?.focus()
  }, [])

  return (
    <>
      <div className="vault-modal__backdrop" aria-hidden="true" />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="vault-modal__dialog max-w-sm"
      >
        <div className="vault-alert__icon">
          <Icon name="alert" size={20} />
        </div>
        <h2 id="confirm-title" className="vault-modal__title">
          {title}
        </h2>
        <p id="confirm-description" className="vault-modal__body">
          {description}
        </p>
        <div className="vault-modal__footer">
          <button
            type="button"
            className="vault-btn vault-btn-secondary vault-btn-sm"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className="vault-btn vault-btn-danger vault-btn-sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  )
}
