import type { HTMLAttributes } from 'react'
import { cn } from './cn'

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  /** Shows a status dot before the label. */
  dot?: boolean
  size?: BadgeSize
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-100 text-surface-700 border-surface-200',
  brand: 'bg-brand-50 text-brand-700 border-brand-200/60',
  success: 'bg-success-50 text-success-700 border-success-200/60',
  warning: 'bg-warning-50 text-warning-800 border-warning-200/60',
  danger: 'bg-danger-50 text-danger-700 border-danger-200/60',
  info: 'bg-info-50 text-info-700 border-info-200/60',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs leading-none tracking-[-0.01em] gap-1',
  md: 'px-2.5 py-1 text-xs leading-none tracking-[-0.01em] gap-1.5',
}

/**
 * Soft-tinted status/label chip: 50-tint background + dark text + hairline
 * border, pill shaped — never a solid saturated block.
 */
export function Badge({
  className,
  variant = 'neutral',
  dot = false,
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium leading-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={cn('rounded-full bg-current', size === 'sm' ? 'size-1.5' : 'size-2')}
        />
      ) : null}
      {children}
    </span>
  )
}
