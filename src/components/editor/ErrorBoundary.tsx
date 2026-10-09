import { Component, type ErrorInfo, type ReactNode } from 'react'

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
          className="flex h-screen flex-col items-center justify-center gap-3 p-6 text-center"
        >
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="max-w-sm text-sm text-neutral-600 dark:text-neutral-400">
            The editor hit an unexpected error. Reload to keep drawing.
          </p>
          <button
            type="button"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
            onClick={() => window.location.reload()}
          >
            Reload editor
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
