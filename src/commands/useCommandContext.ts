import { useMemo } from 'react'
import { usePaintEngine } from '../hooks/PaintProvider'
import { getViewportStore } from '../hooks/useViewport'
import type { CommandContext } from './registry'

/** Builds the command context from the shared engine + viewport stores. */
export function useCommandContext(onToggleShortcuts?: () => void): CommandContext {
  const engine = usePaintEngine()
  return useMemo(() => {
    const viewport = getViewportStore()
    return {
      engine,
      zoomIn: () => viewport.zoomIn(),
      zoomOut: () => viewport.zoomOut(),
      fit: () => viewport.fit(),
      actualSize: () => viewport.actualSize(),
      onToggleShortcuts: onToggleShortcuts ?? (() => {}),
    }
  }, [engine, onToggleShortcuts])
}
