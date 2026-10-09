import type { PaintCommand } from '../voice/types'

export type ShortcutEvent = {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
}

/** True for text entry targets, where drawing shortcuts must not fire. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (target === null || typeof target !== 'object') return false
  const element = target as { tagName?: unknown; isContentEditable?: unknown }
  if (element.isContentEditable === true) return true
  const tagName = typeof element.tagName === 'string' ? element.tagName.toLowerCase() : ''
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select'
}

/**
 * Maps a key event to an allowlisted PaintCommand, so keyboard input travels
 * the same parser-free command path as voice. Returns null for no match.
 */
export function resolveShortcut(event: ShortcutEvent): PaintCommand | null {
  if (event.altKey) return null

  const key = event.key.toLowerCase()
  const mod = event.ctrlKey || event.metaKey

  if (mod) {
    if (key === 'z') return event.shiftKey ? { type: 'history.redo' } : { type: 'history.undo' }
    if (key === 'y') return { type: 'history.redo' }
    if (key === 's') return { type: 'canvas.export', format: 'png' }
    return null
  }

  switch (key) {
    case 'p':
    case 'b':
      return { type: 'tool.select', tool: 'pencil' }
    case 'e':
      return { type: 'tool.select', tool: 'eraser' }
    case 'l':
      return { type: 'tool.select', tool: 'line' }
    case 'r':
      return { type: 'tool.select', tool: 'rectangle' }
    case 'o':
      return { type: 'tool.select', tool: 'ellipse' }
    case '=':
    case '+':
      return { type: 'brush.size.adjust', direction: 'larger' }
    case '-':
    case '_':
      return { type: 'brush.size.adjust', direction: 'smaller' }
    default:
      return null
  }
}

export const SHORTCUTS: readonly { keys: string; label: string }[] = [
  { keys: 'P / B', label: 'Pencil' },
  { keys: 'E', label: 'Eraser' },
  { keys: 'L', label: 'Line' },
  { keys: 'R', label: 'Rectangle' },
  { keys: 'O', label: 'Ellipse' },
  { keys: '- / +', label: 'Smaller / larger brush' },
  { keys: 'Ctrl/Cmd + Z', label: 'Undo' },
  { keys: 'Ctrl/Cmd + Shift + Z', label: 'Redo' },
  { keys: 'Ctrl/Cmd + S', label: 'Export PNG' },
  { keys: '?', label: 'Toggle this panel' },
]
