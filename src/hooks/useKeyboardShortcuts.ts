import { useEffect } from 'react'
import { isEditableTarget, resolveShortcut } from '../keyboard/shortcuts'
import { executeCommand } from '../voice/dispatcher'
import { usePaintEngine } from './PaintProvider'

export type UseKeyboardShortcutsOptions = {
  onToggleShortcuts?: () => void
}

/**
 * Global keyboard shortcuts. They resolve to the same allowlisted commands the
 * voice path uses and are dispatched through the shared engine.
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}): void {
  const engine = usePaintEngine()
  const { onToggleShortcuts } = options

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return

      if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key === '?') {
        onToggleShortcuts?.()
        return
      }

      const command = resolveShortcut(event)
      if (!command) return

      if (event.ctrlKey || event.metaKey) event.preventDefault()
      void executeCommand(engine, command)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [engine, onToggleShortcuts])
}
