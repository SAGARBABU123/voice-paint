import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PaintEngineProvider } from '../../hooks/PaintProvider'
import { getRecentColorsStore } from '../../hooks/useRecentColors'
import { PaintEngine } from '../../paint/engine'
import type { StrokeOperation } from '../../paint/types'
import { ToastProvider } from '../ui/Toast'
import { Toolbar } from './Toolbar'
import { OptionsBar } from './OptionsBar'
import { ToolbarRail } from './ToolbarRail'

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

function renderRail() {
  const engine = new PaintEngine()
  render(
    <PaintEngineProvider engine={engine}>
      <ToastProvider>
        <ToolbarRail />
      </ToastProvider>
    </PaintEngineProvider>,
  )
  // The rail starts collapsed (icon strip); expand it like a real hover.
  act(() => fireEvent.mouseEnter(screen.getByRole('toolbar', { name: /more tools/i })))
  return engine
}

function renderHeader() {
  const engine = new PaintEngine()
  render(
    <PaintEngineProvider engine={engine}>
      <ToastProvider>
        <Toolbar />
        <OptionsBar />
      </ToastProvider>
    </PaintEngineProvider>,
  )
  return engine
}

describe('Toolbar rail', () => {
  beforeEach(() => {
    act(() => getRecentColorsStore().clear())
  })

  it('selects a tool and reflects it with aria-pressed', async () => {
    const user = userEvent.setup()
    const engine = renderRail()

    await user.click(screen.getByRole('button', { name: 'Rectangle' }))

    expect(engine.getSnapshot().activeTool).toBe('rectangle')
    expect(screen.getByRole('button', { name: 'Rectangle' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('selects the pencil tool and opens the pen-style dropdown from it', async () => {
    const user = userEvent.setup()
    const engine = renderHeader()
    act(() => {
      engine.setTool('eraser')
    })

    await user.click(screen.getByRole('button', { name: 'Pencil' }))
    expect(engine.getSnapshot().activeTool).toBe('pencil')

    await user.click(screen.getByRole('option', { name: /dashed/i }))

    expect(engine.getSnapshot().strokeStyle).toBe('dashed')
    expect(engine.getSnapshot().activeTool).toBe('pencil')
  })

  it('updates brush size from the options bar', () => {
    const engine = renderHeader()
    fireEvent.change(screen.getByLabelText('Brush size'), { target: { value: '20' } })
    expect(engine.getSnapshot().brushSize).toBe(20)
  })

  it('updates colour from the palette', async () => {
    const user = userEvent.setup()
    const engine = renderRail()

    await user.click(screen.getByRole('button', { name: 'Select color #ef4444' }))

    expect(engine.getSnapshot().color).toBe('#ef4444')
  })

  it('updates colour from the custom colour input', () => {
    const engine = renderRail()
    fireEvent.change(screen.getByLabelText('Custom color'), { target: { value: '#123456' } })
    expect(engine.getSnapshot().color).toBe('#123456')
  })

  it('disables undo/redo until there is history', async () => {
    const user = userEvent.setup()
    const engine = renderRail()

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

  it('keeps the canvas clear action on the workspace, not the rail', () => {
    // Clear lives as a corner control on the sheet (CanvasStage) — it must not
    // live in the tool rail either.
    renderRail()
    expect(screen.queryByRole('button', { name: /clear canvas/i })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull()
  })

  it('initiates a PNG export from the unified export menu', async () => {
    const user = userEvent.setup()
    const engine = renderRail()
    const exportSpy = vi.spyOn(engine, 'exportPng').mockResolvedValue(undefined)

    await user.click(screen.getByRole('button', { name: 'Export' }))
    expect(screen.getByRole('button', { name: /open image/i })).toBeInTheDocument()
    // fireEvent keeps the click on the live node in jsdom's synthetic world.
    fireEvent.click(screen.getByRole('button', { name: /^png$/i }))

    expect(exportSpy).toHaveBeenCalledTimes(1)
  })

  it('exposes the freeform tools in the header beside the title', () => {
    const engine = new PaintEngine()
    render(
      <PaintEngineProvider engine={engine}>
        <ToastProvider>
          <Toolbar />
        </ToastProvider>
      </PaintEngineProvider>,
    )
    expect(screen.getByRole('button', { name: 'Text' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Fill' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Select' })).toBeTruthy()
  })

  it('selects a freeform tool from the header', async () => {
    const user = userEvent.setup()
    const engine = new PaintEngine()
    render(
      <PaintEngineProvider engine={engine}>
        <ToastProvider>
          <Toolbar />
        </ToastProvider>
      </PaintEngineProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Eraser' }))

    expect(engine.getSnapshot().activeTool).toBe('eraser')
    expect(screen.getByRole('button', { name: 'Eraser' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('switches the size control to font size for the text tool', () => {
    const engine = renderHeader()
    act(() => {
      engine.setTool('text')
    })

    fireEvent.change(screen.getByLabelText('Font size'), { target: { value: '48' } })

    expect(engine.getSnapshot().fontSize).toBe(48)
  })

  it('shows recent colours, selects them, and clears the list', async () => {
    const user = userEvent.setup()
    const engine = renderRail()
    act(() => getRecentColorsStore().remember('#123456'))

    await user.click(screen.getByRole('button', { name: 'Use recent color #123456' }))
    expect(engine.getSnapshot().color).toBe('#123456')

    await user.click(screen.getByRole('button', { name: 'Clear recent colors' }))
    expect(screen.queryByRole('button', { name: 'Use recent color #123456' })).toBeNull()
  })
})
