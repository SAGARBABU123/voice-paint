import { describe, expect, it } from 'vitest'
import { isEditableTarget, resolveShortcut, type ShortcutEvent } from './shortcuts'

function key(k: string, overrides: Partial<ShortcutEvent> = {}): ShortcutEvent {
  return { key: k, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...overrides }
}

describe('resolveShortcut', () => {
  it.each([
    ['p', 'pencil'],
    ['b', 'pencil'],
    ['e', 'eraser'],
    ['l', 'line'],
    ['r', 'rectangle'],
    ['o', 'ellipse'],
    ['t', 'text'],
    ['f', 'fill'],
    ['m', 'select'],
  ])('maps %s to the %s tool', (pressed, tool) => {
    expect(resolveShortcut(key(pressed))).toEqual({ type: 'tool.select', tool })
  })

  it('maps brush size keys', () => {
    expect(resolveShortcut(key('+'))).toEqual({
      type: 'brush.size.adjust',
      direction: 'larger',
    })
    expect(resolveShortcut(key('='))).toEqual({
      type: 'brush.size.adjust',
      direction: 'larger',
    })
    expect(resolveShortcut(key('-'))).toEqual({
      type: 'brush.size.adjust',
      direction: 'smaller',
    })
  })

  it('maps undo, redo, and export with modifiers', () => {
    expect(resolveShortcut(key('z', { ctrlKey: true }))).toEqual({ type: 'history.undo' })
    expect(resolveShortcut(key('z', { ctrlKey: true, shiftKey: true }))).toEqual({
      type: 'history.redo',
    })
    expect(resolveShortcut(key('y', { metaKey: true }))).toEqual({ type: 'history.redo' })
    expect(resolveShortcut(key('s', { ctrlKey: true }))).toEqual({
      type: 'canvas.export',
      format: 'png',
    })
  })

  it('returns null for unbound or unsupported combinations', () => {
    expect(resolveShortcut(key('q'))).toBeNull()
    expect(resolveShortcut(key('p', { ctrlKey: true }))).toBeNull()
    expect(resolveShortcut(key('p', { altKey: true }))).toBeNull()
  })
})

describe('isEditableTarget', () => {
  it('detects form fields and contenteditable hosts', () => {
    expect(isEditableTarget(document.createElement('input'))).toBe(true)
    expect(isEditableTarget(document.createElement('textarea'))).toBe(true)
    expect(isEditableTarget(document.createElement('select'))).toBe(true)
    expect(isEditableTarget({ isContentEditable: true } as unknown as EventTarget)).toBe(true)
  })

  it('returns false for the canvas, null, and plain objects', () => {
    expect(isEditableTarget(document.createElement('canvas'))).toBe(false)
    expect(isEditableTarget(null)).toBe(false)
    expect(isEditableTarget({} as unknown as EventTarget)).toBe(false)
  })
})
