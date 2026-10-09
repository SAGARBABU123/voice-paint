import { describe, expect, it } from 'vitest'
import { History } from './history'

describe('History', () => {
  it('starts empty', () => {
    const history = new History<string>()
    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(false)
    expect(history.applied).toEqual([])
  })

  it('applies pushed entries', () => {
    const history = new History<string>()
    history.push('a')
    history.push('b')
    expect(history.applied).toEqual(['a', 'b'])
    expect(history.length).toBe(2)
  })

  it('undoes and redoes across a cursor', () => {
    const history = new History<string>()
    history.push('a')
    history.push('b')

    expect(history.undo()).toBe(true)
    expect(history.applied).toEqual(['a'])
    expect(history.canRedo).toBe(true)

    expect(history.redo()).toBe(true)
    expect(history.applied).toEqual(['a', 'b'])
  })

  it('tracks the applied count as the cursor moves', () => {
    const history = new History<string>()
    history.push('a')
    history.push('b')
    expect(history.appliedCount).toBe(2)
    history.undo()
    expect(history.appliedCount).toBe(1)
    expect(history.length).toBe(2)
  })

  it('drops the redo branch when a new entry is pushed after undo', () => {
    const history = new History<string>()
    history.push('a')
    history.push('b')
    history.undo()
    history.push('c')

    expect(history.applied).toEqual(['a', 'c'])
    expect(history.canRedo).toBe(false)
  })

  it('does not undo or redo past the bounds', () => {
    const history = new History<string>()
    expect(history.undo()).toBe(false)
    expect(history.redo()).toBe(false)

    history.push('a')
    history.push('b')
    history.undo()
    history.undo()
    expect(history.undo()).toBe(false)
  })

  it('clears all entries and the cursor', () => {
    const history = new History<string>()
    history.push('a')
    history.undo()
    history.clear()
    expect(history.length).toBe(0)
    expect(history.applied).toEqual([])
    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(false)
  })

  it('replaces the entries and resets the cursor', () => {
    const history = new History<string>()
    history.push('a')
    history.undo()
    history.replace(['x', 'y'])
    expect(history.applied).toEqual(['x', 'y'])
    expect(history.appliedCount).toBe(2)
    expect(history.canRedo).toBe(false)
  })

  it('exposes the last applied entry without allocating', () => {
    const history = new History<string>()
    expect(history.last).toBeUndefined()
    history.push('a')
    history.push('b')
    expect(history.last).toBe('b')
    history.undo()
    expect(history.last).toBe('a')
  })
})
