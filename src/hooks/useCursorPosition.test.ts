import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { getCursorPositionStore } from './useCursorPosition'

describe('cursor position store', () => {
  beforeEach(() => {
    act(() => getCursorPositionStore().set(null))
  })

  it('tracks the latest document point', () => {
    const store = getCursorPositionStore()
    act(() => store.set({ x: 12, y: 34 }))
    expect(store.getSnapshot()).toEqual({ x: 12, y: 34 })
  })

  it('clears when the pointer leaves the canvas', () => {
    const store = getCursorPositionStore()
    act(() => store.set({ x: 1, y: 2 }))
    act(() => store.set(null))
    expect(store.getSnapshot()).toBeNull()
  })

  it('notifies subscribers only when the position changes', () => {
    const store = getCursorPositionStore()
    let updates = 0
    const unsubscribe = store.subscribe(() => {
      updates++
    })

    act(() => store.set({ x: 5, y: 5 }))
    act(() => store.set({ x: 5, y: 5 })) // no-op: same point
    act(() => store.set({ x: 6, y: 5 }))
    act(() => store.set(null))
    act(() => store.set(null)) // no-op: already cleared
    unsubscribe()

    expect(updates).toBe(3)
  })
})
