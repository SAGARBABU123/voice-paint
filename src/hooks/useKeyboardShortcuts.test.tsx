import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { PaintEngine } from '../paint/engine'
import type { StrokeOperation } from '../paint/types'
import { PaintEngineProvider } from './PaintProvider'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'

function stroke(id = 's1'): StrokeOperation {
  return {
    id,
    kind: 'stroke',
    tool: 'pencil',
    color: '#111111',
    size: 4,
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
  }
}

function setup(onToggleShortcuts?: () => void) {
  const engine = new PaintEngine()
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PaintEngineProvider engine={engine}>{children}</PaintEngineProvider>
  )
  renderHook(() => useKeyboardShortcuts({ onToggleShortcuts }), { wrapper })
  return engine
}

function press(init: KeyboardEventInit, target: EventTarget = window) {
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }))
  })
}

describe('useKeyboardShortcuts', () => {
  it('selects tools from single keys', () => {
    const engine = setup()
    press({ key: 'r' })
    expect(engine.getSnapshot().activeTool).toBe('rectangle')
  })

  it('undoes and redoes with modifier keys', () => {
    const engine = setup()
    act(() => {
      engine.commit(stroke())
    })

    press({ key: 'z', ctrlKey: true })
    expect(engine.getSnapshot().operationCount).toBe(0)

    press({ key: 'z', ctrlKey: true, shiftKey: true })
    expect(engine.getSnapshot().operationCount).toBe(1)
  })

  it('adjusts the brush size', () => {
    const engine = setup()
    engine.setBrushSize(10)
    press({ key: '+' })
    expect(engine.getSnapshot().brushSize).toBe(12)
  })

  it('exports on Ctrl+S', () => {
    const engine = setup()
    const spy = vi.spyOn(engine, 'exportPng').mockResolvedValue(undefined)
    press({ key: 's', ctrlKey: true })
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('toggles the shortcuts panel on ?', () => {
    const onToggle = vi.fn()
    setup(onToggle)
    press({ key: '?' })
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('ignores shortcuts typed into form fields', () => {
    const engine = setup()
    const input = document.createElement('input')
    document.body.append(input)

    press({ key: 'r' }, input)

    expect(engine.getSnapshot().activeTool).toBe('pencil')
    input.remove()
  })
})
