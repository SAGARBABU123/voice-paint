import { useSyncExternalStore } from 'react'

export type CursorPosition = { x: number; y: number } | null

type Listener = () => void

/**
 * Live pointer read-out in document coordinates, shown in the status bar.
 * Pure UI preference — it never touches the PaintEngine (the engine stays the
 * single source of truth for drawing state).
 */
class CursorPositionStore {
  private position: CursorPosition = null
  private readonly listeners = new Set<Listener>()

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): CursorPosition => this.position

  set = (position: CursorPosition): void => {
    const current = this.position
    if (position === null && current === null) return
    if (
      position !== null &&
      current !== null &&
      position.x === current.x &&
      position.y === current.y
    ) {
      return
    }
    this.position = position
    for (const listener of this.listeners) listener()
  }
}

const cursorPositionStore = new CursorPositionStore()

/** The shared store, exposed for tests and non-React callers. */
export function getCursorPositionStore(): CursorPositionStore {
  return cursorPositionStore
}

export function useCursorPosition(): CursorPosition {
  return useSyncExternalStore(
    cursorPositionStore.subscribe,
    cursorPositionStore.getSnapshot,
    cursorPositionStore.getSnapshot,
  )
}
