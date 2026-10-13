import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PaintEngineProvider } from '../../hooks/PaintProvider'
import { PaintEngine } from '../../paint/engine'
import type { StrokeOperation } from '../../paint/types'
import { ToastProvider } from '../ui/Toast'
import { CanvasStage } from './CanvasStage'

function stroke(id = 's1'): StrokeOperation {
  return {
    id,
    kind: 'stroke',
    tool: 'pencil',
    color: '#111111',
    size: 4,
    points: [
      { x: 10, y: 10 },
      { x: 60, y: 60 },
    ],
  }
}

function renderStage() {
  const engine = new PaintEngine()
  render(
    <PaintEngineProvider engine={engine}>
      <ToastProvider>
        <CanvasStage />
      </ToastProvider>
    </PaintEngineProvider>,
  )
  const canvas = screen.getByLabelText(/drawing canvas/i)
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: 960,
    height: 720,
    right: 960,
    bottom: 720,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect)
  return { engine, canvas }
}

describe('CanvasStage', () => {
  it('commits a pencil stroke from pointer input in document coordinates', () => {
    const { engine, canvas } = renderStage()

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      button: 0,
      pointerType: 'mouse',
      clientX: 100,
      clientY: 100,
    })
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 200, clientY: 150 })
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 200, clientY: 150 })

    const operations = engine.getOperations()
    expect(operations).toHaveLength(1)
    const operation = operations[0]
    expect(operation.kind).toBe('stroke')
    if (operation.kind === 'stroke') {
      expect(operation.points[0]).toEqual({ x: 100, y: 100 })
      expect(operation.points).toContainEqual({ x: 200, y: 150 })
    }
  })

  it('creates a shape operation for shape tools', () => {
    const { engine, canvas } = renderStage()
    act(() => {
      engine.setTool('rectangle')
    })

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      button: 0,
      pointerType: 'mouse',
      clientX: 50,
      clientY: 50,
    })
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 300, clientY: 400 })
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 300, clientY: 400 })

    const operation = engine.getOperations()[0]
    expect(operation?.kind).toBe('shape')
    if (operation?.kind === 'shape') {
      expect(operation.start).toEqual({ x: 50, y: 50 })
      expect(operation.end).toEqual({ x: 300, y: 400 })
    }
  })

  it('ignores secondary (right) mouse buttons', () => {
    const { engine, canvas } = renderStage()

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      button: 2,
      pointerType: 'mouse',
      clientX: 10,
      clientY: 10,
    })
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 10, clientY: 10 })

    expect(engine.getOperations()).toHaveLength(0)
  })

  it('opens a text field and commits a text operation', () => {
    const { engine, canvas } = renderStage()
    act(() => {
      engine.setTool('text')
    })

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      button: 0,
      pointerType: 'mouse',
      clientX: 100,
      clientY: 120,
    })

    const input = screen.getByLabelText('Text to add')
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.click(screen.getByRole('button', { name: 'Place text' }))

    const operation = engine.getOperations()[0]
    expect(operation?.kind).toBe('text')
    if (operation?.kind === 'text') {
      expect(operation).toMatchObject({ text: 'Hello', x: 100, y: 120 })
    }
  })

  it('commits text on Enter and cancels on Escape', () => {
    const { engine, canvas } = renderStage()
    act(() => {
      engine.setTool('text')
    })

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      button: 0,
      pointerType: 'mouse',
      clientX: 10,
      clientY: 10,
    })
    fireEvent.change(screen.getByLabelText('Text to add'), { target: { value: 'Hi' } })
    fireEvent.keyDown(screen.getByLabelText('Text to add'), { key: 'Enter' })
    expect(engine.getOperations()).toHaveLength(1)

    fireEvent.pointerDown(canvas, {
      pointerId: 2,
      button: 0,
      pointerType: 'mouse',
      clientX: 20,
      clientY: 20,
    })
    fireEvent.keyDown(screen.getByLabelText('Text to add'), { key: 'Escape' })

    expect(screen.queryByLabelText('Text to add')).toBeNull()
    expect(engine.getOperations()).toHaveLength(1)
  })

  it('does not create a drawing operation for the fill tool', () => {
    const { engine, canvas } = renderStage()
    act(() => {
      engine.setTool('fill')
    })

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      button: 0,
      pointerType: 'mouse',
      clientX: 40,
      clientY: 40,
    })
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 80, clientY: 80 })
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 80, clientY: 80 })

    // jsdom has no Canvas 2D context, so no fill operation is baked.
    expect(engine.getOperations()).toHaveLength(0)
  })

  it('locks a rectangle to a perfect square while Shift is held', () => {
    const { engine, canvas } = renderStage()
    act(() => {
      engine.setTool('rectangle')
    })

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      button: 0,
      pointerType: 'mouse',
      clientX: 20,
      clientY: 20,
      shiftKey: true,
    })
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 80, clientY: 50 })
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 80, clientY: 50 })

    const operation = engine.getOperations()[0]
    expect(operation?.kind).toBe('shape')
    if (operation?.kind === 'shape') {
      // Without Shift the far corner would be (80, 50); with it, square.
      expect(operation.start).toEqual({ x: 20, y: 20 })
      expect(operation.end).toEqual({ x: 80, y: 80 })
    }
  })

  it('snaps a line to 45 degree increments while Shift is held', () => {
    const { engine, canvas } = renderStage()
    act(() => {
      engine.setTool('line')
    })

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      button: 0,
      pointerType: 'mouse',
      clientX: 40,
      clientY: 40,
      shiftKey: true,
    })
    // Pure diagonal (dx === dy) stays on the 45° axis.
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 100, clientY: 100 })

    const operation = engine.getOperations()[0]
    if (operation?.kind === 'shape') {
      expect(operation.end.x - operation.start.x).toBeCloseTo(
        operation.end.y - operation.start.y,
        5,
      )
    }
  })

  it('deletes a selection with the Delete key', () => {
    const { engine, canvas } = renderStage()
    act(() => {
      engine.commit(stroke())
      engine.setTool('select')
    })
    const deleteSpy = vi.spyOn(engine, 'deleteSelection')

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      button: 0,
      pointerType: 'mouse',
      clientX: 10,
      clientY: 10,
    })
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 110, clientY: 80 })
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 110, clientY: 80 })

    fireEvent.keyDown(window, { key: 'Delete' })

    // CanvasStage routes the key to the engine's undoable cut, then deselects.
    expect(deleteSpy).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Deselect' })).toBeNull()
  })

  it('deselects with the Escape key', () => {
    const { engine, canvas } = renderStage()
    act(() => {
      engine.setTool('select')
    })

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      button: 0,
      pointerType: 'mouse',
      clientX: 10,
      clientY: 10,
    })
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 110, clientY: 80 })
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 110, clientY: 80 })

    expect(screen.getByRole('button', { name: 'Deselect' })).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByRole('button', { name: 'Deselect' })).toBeNull()
  })

  it('cancels crop mode with the Escape key', () => {
    const engine = new PaintEngine()
    const onCropComplete = vi.fn()
    render(
      <PaintEngineProvider engine={engine}>
        <ToastProvider>
          <CanvasStage cropMode onCropComplete={onCropComplete} />
        </ToastProvider>
      </PaintEngineProvider>,
    )
    const canvas = screen.getByLabelText(/drawing canvas/i)
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 960,
      height: 720,
      right: 960,
      bottom: 720,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect)

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      button: 0,
      pointerType: 'mouse',
      clientX: 100,
      clientY: 100,
    })
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 300, clientY: 250 })
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 300, clientY: 250 })

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onCropComplete).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Apply crop' })).toBeDisabled()
  })

  it('clears the canvas from the sheet button only after confirmation', async () => {
    const user = userEvent.setup()
    const { engine } = renderStage()
    act(() => {
      engine.commit(stroke())
    })

    await user.click(screen.getByRole('button', { name: /clear canvas/i }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Clear' }))

    expect(engine.getSnapshot().operationCount).toBe(0)
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('does not clear when confirmation is declined', async () => {
    const user = userEvent.setup()
    const { engine } = renderStage()
    act(() => {
      engine.commit(stroke())
    })

    await user.click(screen.getByRole('button', { name: /clear canvas/i }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(engine.getSnapshot().operationCount).toBe(1)
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('creates a selection marquee and clears it on deselect', () => {
    const { engine, canvas } = renderStage()
    act(() => {
      engine.setTool('select')
    })

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      button: 0,
      pointerType: 'mouse',
      clientX: 10,
      clientY: 10,
    })
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 110, clientY: 80 })
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 110, clientY: 80 })

    fireEvent.click(screen.getByRole('button', { name: 'Deselect' }))

    expect(screen.queryByRole('button', { name: 'Deselect' })).toBeNull()
  })

  it('ignores a click that does not drag out a selection', () => {
    const { engine, canvas } = renderStage()
    act(() => {
      engine.setTool('select')
    })

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      button: 0,
      pointerType: 'mouse',
      clientX: 10,
      clientY: 10,
    })
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 10, clientY: 10 })

    expect(screen.queryByRole('button', { name: 'Deselect' })).toBeNull()
  })

  it('crops the document from a drag in crop mode', () => {
    const engine = new PaintEngine()
    const onCropComplete = vi.fn()
    render(
      <PaintEngineProvider engine={engine}>
        <ToastProvider>
          <CanvasStage cropMode onCropComplete={onCropComplete} />
        </ToastProvider>
      </PaintEngineProvider>,
    )
    const canvas = screen.getByLabelText(/drawing canvas/i)
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 960,
      height: 720,
      right: 960,
      bottom: 720,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect)

    fireEvent.pointerDown(canvas, {
      pointerId: 1,
      button: 0,
      pointerType: 'mouse',
      clientX: 100,
      clientY: 100,
    })
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 300, clientY: 250 })
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 300, clientY: 250 })

    const apply = screen.getByRole('button', { name: 'Apply crop' })
    expect(apply).toBeEnabled()
    fireEvent.click(apply)

    expect(engine.width).toBe(200)
    expect(engine.height).toBe(150)
    expect(onCropComplete).toHaveBeenCalledTimes(1)
  })
})

describe('CanvasStage — hand-drawn reveal', () => {
  it('animates a committed sketch batch with requestAnimationFrame', () => {
    const frames: FrameRequestCallback[] = []
    const rAF = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback)
      return frames.length
    })
    const cAF = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

    const { engine } = renderStage()
    // A sketch batch lands as committed strokes, not pointer input.
    act(() => {
      engine.commitOperations([stroke('s1'), stroke('s2')])
    })

    expect(rAF).toHaveBeenCalled() // the reveal loop started
    const before = frames.length
    // Advance one frame: the loop must keep going (progress < 1).
    act(() => frames[0]?.(performance.now() + 16))
    expect(frames.length).toBeGreaterThan(before)
    // Drive the remaining frames to completion, then assert the loop stops.
    let guard = 0
    while (frames.length > 0 && guard < 1000) {
      const callbacks = frames.splice(0)
      guard += 1
      act(() => callbacks.forEach((callback) => callback(performance.now() + 2000)))
    }
    expect(guard).toBeLessThan(1000)
    cAF.mockRestore()
  })

  it('skips the reveal for a stroke just drawn by the pointer', () => {
    const rAF = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)
    const { engine, canvas } = renderStage()

    act(() => {
      fireEvent.pointerDown(canvas, {
        pointerId: 1,
        button: 0,
        pointerType: 'mouse',
        clientX: 120,
        clientY: 120,
      })
      fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 160, clientY: 140 })
      fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 160, clientY: 140 })
    })

    expect(engine.getSnapshot().operationCount).toBe(1)
    expect(rAF).not.toHaveBeenCalled()
    rAF.mockRestore()
  })
})
