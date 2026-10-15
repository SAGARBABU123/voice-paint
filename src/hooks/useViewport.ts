import { useSyncExternalStore } from 'react'

export type ViewportSnapshot = {
  /** On-screen scale as a percentage (e.g. 100 for 1:1). */
  percent: number
  canZoomIn: boolean
  canZoomOut: boolean
}

type ViewportCommands = {
  zoomIn: () => void
  zoomOut: () => void
  fit: () => void
  actualSize: () => void
}

const EMPTY: ViewportSnapshot = { percent: 100, canZoomIn: true, canZoomOut: true }

/**
 * Bridge between the canvas (which owns zoom/pan) and the status bar (which
 * shows the zoom level and dispatches zoom commands). Mirrors the cursor-store
 * pattern so no prop drilling is needed.
 */
class ViewportStore {
  private snapshot: ViewportSnapshot = EMPTY
  private commands: ViewportCommands | null = null
  private readonly listeners = new Set<() => void>()

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): ViewportSnapshot => this.snapshot

  /** Called by the canvas whenever its view scale changes. */
  setSnapshot(next: ViewportSnapshot): void {
    const current = this.snapshot
    if (
      current.percent === next.percent &&
      current.canZoomIn === next.canZoomIn &&
      current.canZoomOut === next.canZoomOut
    ) {
      return
    }
    this.snapshot = next
    this.emit()
  }

  /** The canvas registers its handlers on mount; cleared on unmount. */
  registerCommands(commands: ViewportCommands): () => void {
    this.commands = commands
    return () => {
      if (this.commands === commands) this.commands = null
    }
  }

  zoomIn = (): void => this.commands?.zoomIn()
  zoomOut = (): void => this.commands?.zoomOut()
  fit = (): void => this.commands?.fit()
  actualSize = (): void => this.commands?.actualSize()

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}

const viewportStore = new ViewportStore()

/** The shared store, exposed for tests and non-React callers. */
export function getViewportStore(): ViewportStore {
  return viewportStore
}

export function useViewport(): ViewportSnapshot {
  return useSyncExternalStore(
    viewportStore.subscribe,
    viewportStore.getSnapshot,
    viewportStore.getSnapshot,
  )
}
