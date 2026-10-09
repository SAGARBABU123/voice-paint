import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PaintEngineProvider } from '../../hooks/PaintProvider'
import { PaintEngine } from '../../paint/engine'
import { CanvasStage } from './CanvasStage'

function renderStage() {
  const engine = new PaintEngine()
  render(
    <PaintEngineProvider engine={engine}>
      <CanvasStage />
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
        <CanvasStage cropMode onCropComplete={onCropComplete} />
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
