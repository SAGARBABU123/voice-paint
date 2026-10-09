import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PaintEngineProvider } from '../../hooks/PaintProvider'
import { PaintEngine } from '../../paint/engine'
import type { StrokeOperation } from '../../paint/types'
import { Toolbar } from './Toolbar'

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

function renderToolbar() {
  const engine = new PaintEngine()
  render(
    <PaintEngineProvider engine={engine}>
      <Toolbar />
    </PaintEngineProvider>,
  )
  return engine
}

describe('Toolbar', () => {
  it('selects a tool and reflects it with aria-pressed', async () => {
    const user = userEvent.setup()
    const engine = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Rectangle' }))

    expect(engine.getSnapshot().activeTool).toBe('rectangle')
    expect(screen.getByRole('button', { name: 'Rectangle' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('updates brush size from the slider', () => {
    const engine = renderToolbar()
    fireEvent.change(screen.getByLabelText('Brush size'), { target: { value: '20' } })
    expect(engine.getSnapshot().brushSize).toBe(20)
  })

  it('updates colour from the palette', async () => {
    const user = userEvent.setup()
    const engine = renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Select color #ef4444' }))

    expect(engine.getSnapshot().color).toBe('#ef4444')
  })

  it('updates colour from the custom colour input', () => {
    const engine = renderToolbar()
    fireEvent.change(screen.getByLabelText('Custom color'), { target: { value: '#123456' } })
    expect(engine.getSnapshot().color).toBe('#123456')
  })

  it('disables undo/redo until there is history', async () => {
    const user = userEvent.setup()
    const engine = renderToolbar()

    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Redo' })).toBeDisabled()

    act(() => {
      engine.commit(stroke())
    })

    const undo = screen.getByRole('button', { name: 'Undo' })
    expect(undo).toBeEnabled()

    await user.click(undo)

    expect(engine.getSnapshot().canUndo).toBe(false)
    expect(screen.getByRole('button', { name: 'Redo' })).toBeEnabled()
  })

  it('clears the canvas only after confirmation', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const engine = renderToolbar()
    act(() => {
      engine.commit(stroke())
    })

    await user.click(screen.getByRole('button', { name: 'Clear' }))

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(engine.getSnapshot().operationCount).toBe(0)
    confirmSpy.mockRestore()
  })

  it('does not clear when confirmation is declined', async () => {
    const user = userEvent.setup()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const engine = renderToolbar()
    act(() => {
      engine.commit(stroke())
    })

    await user.click(screen.getByRole('button', { name: 'Clear' }))

    expect(engine.getSnapshot().operationCount).toBe(1)
    confirmSpy.mockRestore()
  })

  it('initiates a PNG export', async () => {
    const user = userEvent.setup()
    const engine = renderToolbar()
    const exportSpy = vi.spyOn(engine, 'exportPng').mockResolvedValue(undefined)

    await user.click(screen.getByRole('button', { name: /export png/i }))

    expect(exportSpy).toHaveBeenCalledTimes(1)
  })

  it('exposes the text, fill and select tools', () => {
    renderToolbar()
    expect(screen.getByRole('button', { name: 'Text' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Fill' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Select' })).toBeTruthy()
  })

  it('switches the size control to font size for the text tool', () => {
    const engine = renderToolbar()
    act(() => {
      engine.setTool('text')
    })

    fireEvent.change(screen.getByLabelText('Font size'), { target: { value: '48' } })

    expect(engine.getSnapshot().fontSize).toBe(48)
  })
})
