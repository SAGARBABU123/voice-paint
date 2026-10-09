import { useEffect, useSyncExternalStore } from 'react'
import { addRecentColor, parseRecentColors, RECENT_COLORS_STORAGE_KEY } from '../paint/recentColors'
import { usePaintEngine } from './PaintProvider'

type Listener = () => void

/**
 * Tiny external store for recently used colours. It is a user-interface
 * preference, not document state, so it never touches the PaintEngine and is
 * kept in `localStorage` (the engine stays the single source of truth for the
 * active colour).
 */
export class RecentColorsStore {
  private colors: readonly string[]
  private readonly listeners = new Set<Listener>()

  constructor(initial: readonly string[] = []) {
    this.colors = parseRecentColors(initial)
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getSnapshot = (): readonly string[] => this.colors

  remember = (color: string): void => {
    const next = addRecentColor(this.colors, color)
    if (sameColors(next, this.colors)) return
    this.colors = next
    this.persist()
    this.emit()
  }

  clear = (): void => {
    if (this.colors.length === 0) return
    this.colors = []
    this.persist()
    this.emit()
  }

  private persist(): void {
    try {
      localStorage.setItem(RECENT_COLORS_STORAGE_KEY, JSON.stringify(this.colors))
    } catch {
      // Storage can be unavailable (private mode, quota, SSR); recent colours
      // are a convenience, so failing to persist is harmless.
    }
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }
}

function sameColors(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((color, index) => color === b[index])
}

function loadInitialColors(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_COLORS_STORAGE_KEY)
    return raw ? parseRecentColors(JSON.parse(raw) as unknown) : []
  } catch {
    return []
  }
}

const recentColorsStore = new RecentColorsStore(loadInitialColors())

/** The shared store, exposed for tests and non-React callers. */
export function getRecentColorsStore(): RecentColorsStore {
  return recentColorsStore
}

export type UseRecentColorsResult = {
  colors: readonly string[]
  clear: () => void
}

export function useRecentColors(): UseRecentColorsResult {
  const colors = useSyncExternalStore(
    recentColorsStore.subscribe,
    recentColorsStore.getSnapshot,
    recentColorsStore.getSnapshot,
  )
  return { colors, clear: recentColorsStore.clear }
}

/**
 * Records the engine's active colour whenever the user changes it, so palette,
 * custom-colour, and voice changes all feed the same recent list. The initial
 * colour is not recorded.
 */
export function useRecordRecentColor(): void {
  const engine = usePaintEngine()

  useEffect(() => {
    let previous = engine.getSnapshot().color
    return engine.subscribe(() => {
      const next = engine.getSnapshot().color
      if (next === previous) return
      previous = next
      recentColorsStore.remember(next)
    })
  }, [engine])
}
