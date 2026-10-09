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
