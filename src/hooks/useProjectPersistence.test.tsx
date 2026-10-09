import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { PaintEngine } from '../paint/engine'
import type { StrokeOperation } from '../paint/types'
import { MemoryProjectStore } from '../project/memoryProjectStore'
import type { ProjectStore } from '../project/types'
import { PaintEngineProvider } from './PaintProvider'
import { useProjectPersistence } from './useProjectPersistence'

function stroke(id = 'a'): StrokeOperation {
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

function setup(store: ProjectStore, engine = new PaintEngine()) {
  const view = renderHook(() => useProjectPersistence({ store, autosaveDelayMs: 5 }), {
    wrapper: wrapperFor(engine),
  })
  return { engine, view }
}

async function flush() {
  await act(async () => {
    await Promise.resolve()
  })
}

describe('useProjectPersistence', () => {
  it('restores saved operations on mount', async () => {
    const store = new MemoryProjectStore()
    await store.save({ version: 1, width: 960, height: 720, operations: [stroke('saved')] })

    const { engine } = setup(store)
    await flush()

    await waitFor(() => expect(engine.getSnapshot().operationCount).toBe(1))
    expect(engine.getOperations()[0]?.id).toBe('saved')
  })

  it('restores the saved document dimensions', async () => {
    const store = new MemoryProjectStore()
    await store.save({ version: 1, width: 480, height: 360, operations: [stroke('saved')] })

    const { engine } = setup(store)
    await flush()

    await waitFor(() => expect(engine.getSnapshot().operationCount).toBe(1))
    expect(engine.width).toBe(480)
    expect(engine.height).toBe(360)
  })

  it('autosaves changes after the debounce delay', async () => {
    const store = new MemoryProjectStore()
    const { engine, view } = setup(store)
    await flush()

    act(() => {
      engine.commit(stroke('new'))
    })

    await waitFor(async () => {
      const saved = await store.load()
      expect(saved?.operations.map((operation) => operation.id)).toEqual(['new'])
    })
    await waitFor(() => expect(view.result.current.status).toBe('saved'))
  })

  it('does not overwrite a drawing started before restore finishes', async () => {
    const store = new MemoryProjectStore()
    await store.save({ version: 1, width: 960, height: 720, operations: [stroke('saved')] })

    const engine = new PaintEngine()
    engine.loadDocument(960, 720, [stroke('local')])
    setup(store, engine)
    await flush()

    expect(engine.getOperations().map((operation) => operation.id)).toEqual(['local'])
  })

  it('reports unavailable when the store fails to load', async () => {
    const failing: ProjectStore = {
      load: () => Promise.reject(new Error('nope')),
      save: () => Promise.resolve(),
      clear: () => Promise.resolve(),
    }

    const { view } = setup(failing)
    await flush()

    await waitFor(() => expect(view.result.current.status).toBe('unavailable'))
  })

  it('reports an error when saving fails', async () => {
    const failing: ProjectStore = {
      load: () => Promise.resolve(null),
      save: () => Promise.reject(new Error('disk full')),
      clear: () => Promise.resolve(),
    }

    const { engine, view } = setup(failing)
    await flush()

    act(() => {
      engine.commit(stroke('new'))
    })

    await waitFor(() => expect(view.result.current.status).toBe('error'))
  })
})
