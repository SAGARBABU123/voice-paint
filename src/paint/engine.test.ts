import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_BRUSH_SIZE,
  DEFAULT_COLOR,
  DEFAULT_FONT_SIZE,
  MAX_BRUSH_SIZE,
  MAX_FONT_SIZE,
  MIN_BRUSH_SIZE,
  MIN_FONT_SIZE,
} from './constants'
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
    expect(snapshot.fontSize).toBe(DEFAULT_FONT_SIZE)
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

  it('validates and clamps the font size', () => {
    const engine = new PaintEngine()
    expect(engine.getSnapshot().fontSize).toBe(DEFAULT_FONT_SIZE)

    engine.setFontSize(1)
    expect(engine.getSnapshot().fontSize).toBe(MIN_FONT_SIZE)

    engine.setFontSize(9999)
    expect(engine.getSnapshot().fontSize).toBe(MAX_FONT_SIZE)

    engine.setFontSize(40.4)
    expect(engine.getSnapshot().fontSize).toBe(40)
  })

  it('adds text using the active colour and font size, undoably', () => {
    const engine = new PaintEngine()
    engine.setColor('#3b82f6')
    engine.setFontSize(40)

    expect(engine.addText('  Hello  ', { x: 12, y: 34 })).toBe(true)

    const operation = engine.getOperations()[0]
    expect(operation?.kind).toBe('text')
    if (operation?.kind === 'text') {
      expect(operation).toMatchObject({
        text: 'Hello',
        x: 12,
        y: 34,
        color: '#3b82f6',
        fontSize: 40,
      })
    }

    expect(engine.undo()).toBe(true)
    expect(engine.getSnapshot().operationCount).toBe(0)
  })

  it('ignores blank text', () => {
    const engine = new PaintEngine()
    expect(engine.addText('   ', { x: 0, y: 0 })).toBe(false)
    expect(engine.getSnapshot().operationCount).toBe(0)
  })

  it('does not change the document when a fill cannot be rasterised', () => {
    const engine = new PaintEngine()
    // jsdom provides no Canvas 2D context, so the fill pipeline is a safe no-op.
    expect(engine.fillAt({ x: 10, y: 10 })).toBe(false)
    expect(engine.getSnapshot().operationCount).toBe(0)
  })

  it('draws a centred shape with the active colour and size', () => {
    const engine = new PaintEngine()
    engine.setColor('#22c55e')

    engine.drawShape('ellipse')

    const operation = engine.getOperations()[0]
    expect(operation?.kind).toBe('shape')
    if (operation?.kind === 'shape') {
      expect(operation.tool).toBe('ellipse')
      expect(operation.color).toBe('#22c55e')
      expect(operation.start.x).toBeLessThan(operation.end.x)
      expect(operation.start.y).toBeLessThan(operation.end.y)
    }
  })

  it('draws a centred horizontal line', () => {
    const engine = new PaintEngine()
    engine.drawShape('line')

    const operation = engine.getOperations()[0]
    expect(operation?.kind).toBe('shape')
    if (operation?.kind === 'shape') {
      expect(operation.start.y).toBe(operation.end.y)
      expect(operation.start.x).toBeLessThan(operation.end.x)
    }
  })

  it('refuses a selection move with no offset or a bad offset', () => {
    const engine = new PaintEngine()
    const rect = { x: 0, y: 0, width: 10, height: 10 }
    expect(engine.moveSelection(rect, 0, 0)).toBe(false)
    expect(engine.moveSelection(rect, Number.NaN, 1)).toBe(false)
  })

  it('does not change the document when a selection cannot be rasterised', () => {
    const engine = new PaintEngine()
    const rect = { x: 0, y: 0, width: 10, height: 10 }
    expect(engine.deleteSelection(rect)).toBe(false)
    expect(engine.moveSelection(rect, 5, 5)).toBe(false)
    expect(engine.getSnapshot().operationCount).toBe(0)
  })

  it('tracks operations through undo and redo', () => {
    const engine = new PaintEngine()
    engine.commit(stroke('a'))
    engine.commit(stroke('b'))
    expect(engine.getSnapshot().operationCount).toBe(2)
    expect(engine.getOperations().map((op) => op.id)).toEqual(['a', 'b'])

    expect(engine.undo()).toBe(true)
    expect(engine.getSnapshot().canRedo).toBe(true)
    expect(engine.getSnapshot().operationCount).toBe(1)
    expect(engine.getOperations().map((op) => op.id)).toEqual(['a'])

    expect(engine.redo()).toBe(true)
    expect(engine.getOperations().map((op) => op.id)).toEqual(['a', 'b'])
  })

  it('refuses to undo or redo with nothing to do', () => {
    const engine = new PaintEngine()
    expect(engine.undo()).toBe(false)
    expect(engine.redo()).toBe(false)
  })

  it('clears the document, undoably', () => {
    const engine = new PaintEngine()
    engine.commit(stroke('a'))
    engine.clear()
    expect(engine.getSnapshot().operationCount).toBe(0)
    expect(engine.getSnapshot().canUndo).toBe(true)

    engine.undo()
    expect(engine.getSnapshot().operationCount).toBe(1)
  })

  it('loads a saved document as a fresh history', () => {
    const engine = new PaintEngine()
    engine.commit(stroke('old'))

    engine.loadDocument(960, 720, [stroke('a'), stroke('b')])

    expect(engine.getOperations().map((operation) => operation.id)).toEqual(['a', 'b'])
    expect(engine.getSnapshot().operationCount).toBe(2)
    expect(engine.getSnapshot().canUndo).toBe(false)
    expect(engine.getSnapshot().canRedo).toBe(false)
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

  it('rotates the document and its content', () => {
    const engine = new PaintEngine()
    engine.commit({
      id: 'l',
      kind: 'shape',
      tool: 'line',
      color: '#111111',
      size: 2,
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
    })

    engine.rotateDocument(1)

    expect(engine.width).toBe(720)
    expect(engine.height).toBe(960)
    const operation = engine.getOperations()[0]
    if (operation?.kind === 'shape') {
      expect(operation.start).toEqual({ x: 720, y: 0 })
      expect(operation.end).toEqual({ x: 720, y: 100 })
    }
  })

  it('undoes a rotation', () => {
    const engine = new PaintEngine()
    engine.rotateDocument(1)
    expect(engine.width).toBe(720)

    engine.undo()

    expect(engine.width).toBe(960)
    expect(engine.height).toBe(720)
  })

  it('resizes the document, scaling content', () => {
    const engine = new PaintEngine()
    engine.commit({
      id: 's',
      kind: 'stroke',
      tool: 'pencil',
      color: '#111111',
      size: 4,
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
    })

    engine.resizeDocument(480, 360)

    expect(engine.width).toBe(480)
    expect(engine.height).toBe(360)
    const operation = engine.getOperations()[0]
    if (operation?.kind === 'stroke') {
      expect(operation.points[1]).toEqual({ x: 50, y: 50 })
      expect(operation.size).toBe(2)
    }
  })

  it('crops the document, translating content to the new origin', () => {
    const engine = new PaintEngine()
    engine.commit({
      id: 's',
      kind: 'stroke',
      tool: 'pencil',
      color: '#111111',
      size: 4,
      points: [{ x: 10, y: 20 }],
    })

    engine.cropDocument({ x: 10, y: 20, width: 200, height: 100 })

    expect(engine.width).toBe(200)
    expect(engine.height).toBe(100)
    const operation = engine.getOperations()[0]
    if (operation?.kind === 'stroke') expect(operation.points[0]).toEqual({ x: 0, y: 0 })
  })

  it('ignores an empty crop and a no-op resize', () => {
    const engine = new PaintEngine()
    engine.commit(stroke())
    const before = engine.getSnapshot().revision

    engine.cropDocument({ x: 0, y: 0, width: 0, height: 0 })
    engine.resizeDocument(960, 720)

    expect(engine.getSnapshot().revision).toBe(before)
  })
})
