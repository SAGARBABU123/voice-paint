import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { cn } from './cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** React 19 forwards refs as plain props. */
  ref?: Ref<HTMLButtonElement>
  variant?: ButtonVariant
  size?: ButtonSize
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  loading?: boolean
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'vault-btn-primary',
  secondary: 'vault-btn-secondary',
  ghost: 'vault-btn-ghost',
  danger: 'vault-btn-danger',
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'vault-btn-xs',
  sm: 'vault-btn-sm',
  md: 'vault-btn-md',
  lg: 'vault-btn-lg',
}

/**
 * Vault-consistent button. Styles come from button.css (token-driven);
 * `active:shadow-pressed` sinks the button into the canvas on press and
 * focus-visible renders a brand ring.
 */
export function Button({
  className,
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  loading = false,
  fullWidth = false,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        'vault-btn',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Spinner className="size-4" />
      ) : leadingIcon ? (
        <span aria-hidden="true" className="shrink-0">
          {leadingIcon}
        </span>
      ) : null}
      <span className="truncate">{children}</span>
      {!loading && trailingIcon ? (
        <span aria-hidden="true" className="shrink-0">
          {trailingIcon}
        </span>
      ) : null}
    </button>
  )
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin shrink-0', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
