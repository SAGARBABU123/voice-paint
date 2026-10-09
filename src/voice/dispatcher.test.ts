import { describe, expect, it, vi } from 'vitest'
import { PaintEngine } from '../paint/engine'
import type { StrokeOperation } from '../paint/types'
import { dispatchCommands, executeCommand } from './dispatcher'

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

describe('executeCommand', () => {
  it('routes tool selection to the shared engine', async () => {
    const engine = new PaintEngine()
    await executeCommand(engine, { type: 'tool.select', tool: 'ellipse' })
    expect(engine.getSnapshot().activeTool).toBe('ellipse')
  })

  it('draws a centred shape through the shared engine', async () => {
    const engine = new PaintEngine()
    await executeCommand(engine, { type: 'shape.draw', tool: 'ellipse' })

    const operation = engine.getOperations()[0]
    expect(operation?.kind).toBe('shape')
    if (operation?.kind === 'shape') expect(operation.tool).toBe('ellipse')
  })

  it('fills at the document centre through the shared engine', async () => {
    const engine = new PaintEngine()
    const fillSpy = vi.spyOn(engine, 'fillAt').mockReturnValue(true)

    await executeCommand(engine, { type: 'canvas.fill' })

    expect(fillSpy).toHaveBeenCalledWith({ x: engine.width / 2, y: engine.height / 2 })
  })

  it('routes colour and absolute size to the engine', async () => {
    const engine = new PaintEngine()
    await executeCommand(engine, { type: 'color.set', color: '#ff0000' })
    await executeCommand(engine, { type: 'brush.size.set', size: 12 })
    expect(engine.getSnapshot().color).toBe('#ff0000')
    expect(engine.getSnapshot().brushSize).toBe(12)
  })

  it('adjusts brush size relative to the current value', async () => {
    const engine = new PaintEngine()
    engine.setBrushSize(10)

    await executeCommand(engine, { type: 'brush.size.adjust', direction: 'larger' })
    expect(engine.getSnapshot().brushSize).toBe(12)

    await executeCommand(engine, { type: 'brush.size.adjust', direction: 'smaller' })
    expect(engine.getSnapshot().brushSize).toBe(10)
  })

  it('clamps relative adjustment at the limits', async () => {
    const engine = new PaintEngine()
    engine.setBrushSize(1)
    await executeCommand(engine, { type: 'brush.size.adjust', direction: 'smaller' })
    expect(engine.getSnapshot().brushSize).toBe(1)
  })

  it('undoes and redoes', async () => {
    const engine = new PaintEngine()
    engine.commit(stroke('a'))
    await executeCommand(engine, { type: 'history.undo' })
    expect(engine.getSnapshot().operationCount).toBe(0)
    await executeCommand(engine, { type: 'history.redo' })
    expect(engine.getSnapshot().operationCount).toBe(1)
  })

  it('calls onHelp for help.open', async () => {
    const engine = new PaintEngine()
    const onHelp = vi.fn()
    await executeCommand(engine, { type: 'help.open' }, { onHelp })
    expect(onHelp).toHaveBeenCalledTimes(1)
  })

  it('exports and reports failure through onError', async () => {
    const engine = new PaintEngine()
    const spy = vi.spyOn(engine, 'exportPng').mockRejectedValue(new Error('nope'))
    const onError = vi.fn()

    await executeCommand(engine, { type: 'canvas.export', format: 'png' }, { onError })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledTimes(1)
  })
})

describe('dispatchCommands', () => {
  it('executes safe commands and defers clear for confirmation', async () => {
    const engine = new PaintEngine()
    engine.commit(stroke())

    const result = await dispatchCommands(engine, [
      { type: 'tool.select', tool: 'line' },
      { type: 'canvas.clear' },
    ])

    expect(result.executed).toEqual([{ type: 'tool.select', tool: 'line' }])
    expect(result.pending).toEqual([{ type: 'canvas.clear' }])
    expect(engine.getSnapshot().activeTool).toBe('line')
    expect(engine.getSnapshot().operationCount).toBe(1)
  })

  it('only clears once executeCommand is called after confirmation', async () => {
    const engine = new PaintEngine()
    engine.commit(stroke())
    await dispatchCommands(engine, [{ type: 'canvas.clear' }])
    expect(engine.getSnapshot().operationCount).toBe(1)

    await executeCommand(engine, { type: 'canvas.clear' })
    expect(engine.getSnapshot().operationCount).toBe(0)
  })
})
