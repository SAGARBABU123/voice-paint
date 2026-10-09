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

  it('executes a final command through the shared engine', async () => {
    const { engine, view, emitResult } = setup()
    act(() => view.result.current.start())

    await act(async () => {
      emitResult('switch to eraser')
    })

    expect(engine.getSnapshot().activeTool).toBe('eraser')
    expect(view.result.current.message).toMatch(/eraser/i)
  })

  it('shows interim results but never executes them', async () => {
    const { engine, view, emitResult } = setup()
    act(() => view.result.current.start())

    await act(async () => {
      emitResult('use rectangle', false, 0.4)
    })

    expect(view.result.current.transcript).toBe('use rectangle')
    expect(engine.getSnapshot().activeTool).toBe('pencil')
  })

  it('does not change the canvas for unknown phrases', async () => {
    const { engine, view, emitResult } = setup()
    act(() => view.result.current.start())
    const before = engine.getSnapshot()

    await act(async () => {
      emitResult('make me a sandwich')
    })

    expect(engine.getSnapshot()).toBe(before)
  })

  it('requires confirmation before clearing', async () => {
    const { engine, view, emitResult } = setup()
    act(() => {
      engine.commit(stroke())
    })

    act(() => view.result.current.start())

    await act(async () => {
      emitResult('clear canvas')
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
    act(() => view.result.current.cancelPending())

    expect(engine.getSnapshot().operationCount).toBe(1)
    expect(view.result.current.pendingConfirm).toBeNull()
  })

  it('undoes and redoes through voice', async () => {
    const { engine, view, emitResult } = setup()
    act(() => {
      engine.commit(stroke('a'))
      engine.commit(stroke('b'))
    })
    act(() => view.result.current.start())

    await act(async () => {
      emitResult('undo')
    })
    expect(engine.getSnapshot().operationCount).toBe(1)

    await act(async () => {
      emitResult('redo')
    })
    expect(engine.getSnapshot().operationCount).toBe(2)
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

  it('opens the help panel on request', async () => {
    const { view, emitResult } = setup()
    act(() => view.result.current.start())

    await act(async () => {
      emitResult('what can I say')
    })

    expect(view.result.current.helpOpen).toBe(true)
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
