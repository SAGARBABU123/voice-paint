import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { PaintEngine } from '../paint/engine'
import type { StrokeOperation } from '../paint/types'
import { createFakeSpeechAdapter } from '../test/fakeSpeechAdapter'
import { PaintEngineProvider } from './PaintProvider'
import { useVoiceCommands } from './useVoiceCommands'

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

function wrapperFor(engine: PaintEngine) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <PaintEngineProvider engine={engine}>{children}</PaintEngineProvider>
  }
}

function setup() {
  const engine = new PaintEngine()
  const fake = createFakeSpeechAdapter()
  const view = renderHook(() => useVoiceCommands({ adapter: fake.adapter }), {
    wrapper: wrapperFor(engine),
  })
  return { engine, view, ...fake }
}

describe('useVoiceCommands', () => {
  it('starts idle and enters the listening state', () => {
    const { view } = setup()
    expect(view.result.current.status).toBe('idle')

    act(() => view.result.current.start())

    expect(view.result.current.status).toBe('listening')
    expect(view.result.current.isListening).toBe(true)
  })

  it('parses a command into a draft, then applies it on runDraft', async () => {
    const { engine, view, emitResult } = setup()
    act(() => view.result.current.start())

    await act(async () => {
      emitResult('switch to eraser')
    })

    // Review first — nothing is applied until the user confirms.
    expect(engine.getSnapshot().activeTool).toBe('pencil')
    expect(view.result.current.draft?.description).toMatch(/eraser/i)

    await act(async () => {
      await view.result.current.runDraft()
    })

    expect(engine.getSnapshot().activeTool).toBe('eraser')
    expect(view.result.current.message).toMatch(/eraser/i)
    expect(view.result.current.draft).toBeNull()
  })

  it('shows interim results but never drafts them', async () => {
    const { engine, view, emitResult } = setup()
    act(() => view.result.current.start())

    await act(async () => {
      emitResult('use rectangle', false, 0.4)
    })

    expect(view.result.current.transcript).toBe('use rectangle')
    expect(view.result.current.draft).toBeNull()
    expect(engine.getSnapshot().activeTool).toBe('pencil')
  })

  it('does not execute a low-confidence final result', async () => {
    const { engine, view, emitResult } = setup()
    act(() => view.result.current.start())

    await act(async () => {
      emitResult('use rectangle', true, 0.2)
    })

    expect(engine.getSnapshot().activeTool).toBe('pencil')
    expect(view.result.current.draft).toBeNull()
    expect(view.result.current.message).toMatch(/not sure/i)
  })

  it('does not change the canvas for unknown phrases', async () => {
    const { engine, view, emitResult } = setup()
    act(() => view.result.current.start())
    const before = engine.getSnapshot()

    await act(async () => {
      emitResult('make me a sandwich')
    })

    expect(engine.getSnapshot()).toBe(before)
    expect(view.result.current.draft).toBeNull()
  })

  it('requires confirmation after applying a clear draft', async () => {
    const { engine, view, emitResult } = setup()
    act(() => {
      engine.commit(stroke())
    })

    act(() => view.result.current.start())

    await act(async () => {
      emitResult('clear canvas')
    })

    expect(view.result.current.draft?.commands[0]?.type).toBe('canvas.clear')
    expect(engine.getSnapshot().operationCount).toBe(1)

    await act(async () => {
      await view.result.current.runDraft()
    })

    expect(view.result.current.pendingConfirm?.type).toBe('canvas.clear')
    expect(engine.getSnapshot().operationCount).toBe(1)

    await act(async () => {
      await view.result.current.confirmPending()
    })

    expect(engine.getSnapshot().operationCount).toBe(0)
  })

  it('keeps the drawing when the clear is cancelled', async () => {
    const { engine, view, emitResult } = setup()
    act(() => {
      engine.commit(stroke())
    })

    act(() => view.result.current.start())

    await act(async () => {
      emitResult('clear canvas')
    })
    await act(async () => {
      await view.result.current.runDraft()
    })
    act(() => view.result.current.cancelPending())

    expect(engine.getSnapshot().operationCount).toBe(1)
    expect(view.result.current.pendingConfirm).toBeNull()
  })

  it('dismisses a draft without painting', async () => {
    const { engine, view, emitResult } = setup()
    act(() => view.result.current.start())

    await act(async () => {
      emitResult('set color to red')
    })

    expect(view.result.current.draft).not.toBeNull()

    act(() => view.result.current.dismissDraft())

    expect(view.result.current.draft).toBeNull()
    expect(engine.getSnapshot().color).toBe('#111111')
    expect(view.result.current.message).toMatch(/cancelled/i)
  })

  it('undoes and redoes through voice after review', async () => {
    const { engine, view, emitResult } = setup()
    act(() => {
      engine.commit(stroke('a'))
      engine.commit(stroke('b'))
    })
    act(() => view.result.current.start())

    await act(async () => {
      emitResult('undo')
    })
    await act(async () => {
      await view.result.current.runDraft()
    })
    expect(engine.getSnapshot().operationCount).toBe(1)

    await act(async () => {
      emitResult('redo')
    })
    await act(async () => {
      await view.result.current.runDraft()
    })
    expect(engine.getSnapshot().operationCount).toBe(2)
  })

  it('executes a compound draw-and-fill command after review', async () => {
    const { engine, view, emitResult } = setup()
    act(() => view.result.current.start())

    await act(async () => {
      emitResult('draw a circle and fill it red')
    })

    expect(engine.getOperations().some((operation) => operation.kind === 'shape')).toBe(false)
    expect(view.result.current.draft?.description).toMatch(/drew/i)

    await act(async () => {
      await view.result.current.runDraft()
    })

    expect(engine.getOperations().some((operation) => operation.kind === 'shape')).toBe(true)
    expect(engine.getSnapshot().color).toBe('#ef4444')
    expect(view.result.current.message).toMatch(/drew/i)
  })

  it('shows a transcribing state while an upload is processing', () => {
    const { view, emitProcessing } = setup()
    act(() => view.result.current.start())

    act(() => emitProcessing())
    expect(view.result.current.status).toBe('transcribing')

    // Stopping must not knock the UI out of the transcribing state.
    act(() => view.result.current.stop())
    expect(view.result.current.status).toBe('transcribing')
  })

  it('opens the help panel after the draft is applied', async () => {
    const { view, emitResult } = setup()
    act(() => view.result.current.start())

    await act(async () => {
      emitResult('what can I say')
    })
    await act(async () => {
      await view.result.current.runDraft()
    })

    expect(view.result.current.helpOpen).toBe(true)
  })

  it('surfaces permission denial', () => {
    const { view, emitError } = setup()
    act(() => view.result.current.start())

    act(() => {
      emitError('not-allowed', 'Microphone blocked')
    })

    expect(view.result.current.status).toBe('denied')
    expect(view.result.current.message).toBe('Microphone blocked')
  })

  it('reports unsupported when the adapter is unavailable', () => {
    const engine = new PaintEngine()
    const fake = createFakeSpeechAdapter(false)
    const view = renderHook(() => useVoiceCommands({ adapter: fake.adapter }), {
      wrapper: wrapperFor(engine),
    })

    expect(view.result.current.supported).toBe(false)
    expect(view.result.current.status).toBe('unsupported')
  })
})
