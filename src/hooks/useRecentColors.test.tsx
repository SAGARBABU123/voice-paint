import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { PaintEngine } from '../paint/engine'
import { RECENT_COLORS_STORAGE_KEY } from '../paint/recentColors'
import { PaintEngineProvider } from './PaintProvider'
import {
  getRecentColorsStore,
  RecentColorsStore,
  useRecentColors,
  useRecordRecentColor,
} from './useRecentColors'

function wrapperFor(engine: PaintEngine) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <PaintEngineProvider engine={engine}>{children}</PaintEngineProvider>
  }
}

describe('RecentColorsStore', () => {
  it('records colours newest-first with de-duplication', () => {
    const store = new RecentColorsStore()
    store.remember('#EF4444')
    store.remember('#3b82f6')
    store.remember('#ef4444')
    expect(store.getSnapshot()).toEqual(['#ef4444', '#3b82f6'])
  })

  it('ignores invalid colours and persists valid ones', () => {
    const store = new RecentColorsStore()
    store.remember('not-a-colour')
    expect(store.getSnapshot()).toEqual([])

    store.remember('#123')
    expect(JSON.parse(localStorage.getItem(RECENT_COLORS_STORAGE_KEY) ?? 'null')).toEqual(['#123'])
  })

  it('clears the list', () => {
    const store = new RecentColorsStore(['#123456'])
    store.clear()
    expect(store.getSnapshot()).toEqual([])
  })
})

describe('useRecentColors with useRecordRecentColor', () => {
  beforeEach(() => {
    act(() => getRecentColorsStore().clear())
  })

  it('records engine colour changes and ignores other changes', () => {
    const engine = new PaintEngine()
    const { result } = renderHook(
      () => {
        useRecordRecentColor()
        return useRecentColors()
      },
      { wrapper: wrapperFor(engine) },
    )

    expect(result.current.colors).toEqual([])

    act(() => engine.setBrushSize(10))
    expect(result.current.colors).toEqual([])

    act(() => engine.setColor('#ef4444'))
    expect(result.current.colors).toEqual(['#ef4444'])

    act(() => engine.setColor('#3b82f6'))
    expect(result.current.colors).toEqual(['#3b82f6', '#ef4444'])
  })

  it('clears through the hook', () => {
    const engine = new PaintEngine()
    const { result } = renderHook(() => useRecentColors(), { wrapper: wrapperFor(engine) })

    act(() => getRecentColorsStore().remember('#abcdef'))
    expect(result.current.colors).toEqual(['#abcdef'])

    act(() => result.current.clear())
    expect(result.current.colors).toEqual([])
  })
})
