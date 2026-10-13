import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'

type ErrorBoundaryProps = { children: ReactNode }
type ErrorBoundaryState = { hasError: boolean }

/** Catches unexpected render errors so the app fails gracefully instead of blanking. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('Unhandled error in Voice Over Paint:', error, info)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex h-screen flex-col items-center justify-center gap-4 bg-surface-50 p-6 text-center"
        >
          <div className="vault-empty__icon">
            <Icon name="alert" size={22} />
          </div>
          <h1 className="font-display text-xl font-semibold tracking-tight text-surface-900">
            Something went wrong
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-surface-600">
            The editor hit an unexpected error. Reload to keep drawing.
          </p>
          <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
            Reload editor
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
