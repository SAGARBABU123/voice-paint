import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_BRUSH_SIZE, DEFAULT_COLOR, MAX_BRUSH_SIZE, MIN_BRUSH_SIZE } from './constants'
import { PaintEngine } from './engine'
import type { PaintTool, StrokeOperation } from './types'

function stroke(id = 's1'): StrokeOperation {
  return {
    id,
    kind: 'stroke',
    tool: 'pencil',
    color: '#111111',
    size: 4,
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ],
  }
}

describe('PaintEngine', () => {
  it('starts with the documented defaults', () => {
    const engine = new PaintEngine()
    const snapshot = engine.getSnapshot()
    expect(snapshot.activeTool).toBe('pencil')
    expect(snapshot.color).toBe(DEFAULT_COLOR)
    expect(snapshot.brushSize).toBe(DEFAULT_BRUSH_SIZE)
    expect(snapshot.canUndo).toBe(false)
    expect(snapshot.canRedo).toBe(false)
    expect(snapshot.operationCount).toBe(0)
  })

  it('changes the active tool', () => {
    const engine = new PaintEngine()
    engine.setTool('ellipse')
    expect(engine.getSnapshot().activeTool).toBe('ellipse')
  })

  it('ignores unknown tools', () => {
    const engine = new PaintEngine()
    engine.setTool('spray' as unknown as PaintTool)
    expect(engine.getSnapshot().activeTool).toBe('pencil')
  })

  it('validates colours and normalizes hex casing', () => {
    const engine = new PaintEngine()
    engine.setColor('red')
    expect(engine.getSnapshot().color).toBe(DEFAULT_COLOR)

    engine.setColor('#FF0000')
    expect(engine.getSnapshot().color).toBe('#ff0000')

    engine.setColor('#abc')
    expect(engine.getSnapshot().color).toBe('#abc')
  })

  it('clamps brush size to the documented limits', () => {
    const engine = new PaintEngine()
    engine.setBrushSize(999)
    expect(engine.getSnapshot().brushSize).toBe(MAX_BRUSH_SIZE)

    engine.setBrushSize(-5)
    expect(engine.getSnapshot().brushSize).toBe(MIN_BRUSH_SIZE)

    engine.setBrushSize(7.6)
    expect(engine.getSnapshot().brushSize).toBe(8)
  })

  it('tracks operations through undo and redo', () => {
    const engine = new PaintEngine()
    engine.commit(stroke('a'))
    engine.commit(stroke('b'))
    expect(engine.getSnapshot().operationCount).toBe(2)
    expect(engine.getOperations().map((op) => op.id)).toEqual(['a', 'b'])

    expect(engine.undo()).toBe(true)
    expect(engine.getSnapshot().canRedo).toBe(true)
    expect(engine.getOperations().map((op) => op.id)).toEqual(['a'])

    expect(engine.redo()).toBe(true)
    expect(engine.getOperations().map((op) => op.id)).toEqual(['a', 'b'])
  })

  it('refuses to undo or redo with nothing to do', () => {
    const engine = new PaintEngine()
    expect(engine.undo()).toBe(false)
    expect(engine.redo()).toBe(false)
  })

  it('clears all history', () => {
    const engine = new PaintEngine()
    engine.commit(stroke('a'))
    engine.clear()
    expect(engine.getSnapshot().operationCount).toBe(0)
    expect(engine.getSnapshot().canUndo).toBe(false)
  })

  it('notifies subscribers on change', () => {
    const engine = new PaintEngine()
    const listener = vi.fn()
    engine.subscribe(listener)

    engine.setTool('line')
    engine.commit(stroke('a'))
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('does not notify when a change is a no-op', () => {
    const engine = new PaintEngine()
    const listener = vi.fn()
    engine.subscribe(listener)

    engine.setTool('pencil')
    engine.clear()
    expect(listener).not.toHaveBeenCalled()
  })

  it('unsubscribes listeners', () => {
    const engine = new PaintEngine()
    const listener = vi.fn()
    const unsubscribe = engine.subscribe(listener)
    unsubscribe()
    engine.setTool('eraser')
    expect(listener).not.toHaveBeenCalled()
  })

  it('cannot export before a canvas is attached', async () => {
    const engine = new PaintEngine()
    await expect(engine.exportPng()).rejects.toThrow(/canvas is not attached/i)
  })
})
