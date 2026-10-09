import { describe, expect, it } from 'vitest'
import { PaintEngine } from '../paint/engine'
import type { StrokeOperation } from '../paint/types'
import { createSnapshot, isProjectSnapshot } from './serialize'

function stroke(id = 'a'): StrokeOperation {
  return {
    id,
    kind: 'stroke',
    tool: 'pencil',
    color: '#111111',
    size: 4,
    points: [
      { x: 0, y: 0 },
      { x: 5, y: 5 },
    ],
  }
}

describe('createSnapshot', () => {
  it('captures the document dimensions and operations', () => {
    const engine = new PaintEngine()
    engine.commit(stroke('a'))

    const snapshot = createSnapshot(engine)

    expect(snapshot.version).toBe(1)
    expect(snapshot.width).toBe(960)
    expect(snapshot.height).toBe(720)
    expect(snapshot.operations.map((operation) => operation.id)).toEqual(['a'])
  })

  it('deep-copies operations so later edits cannot mutate the snapshot', () => {
    const engine = new PaintEngine()
    engine.commit(stroke('a'))
    const original = engine.getOperations()[0]

    const snapshot = createSnapshot(engine)
    const captured = snapshot.operations[0]

    expect(captured).not.toBe(original)
    if (original?.kind === 'stroke' && captured?.kind === 'stroke') {
      expect(captured.points[0]).not.toBe(original.points[0])
    }
  })
})

describe('isProjectSnapshot', () => {
  it('accepts a valid snapshot', () => {
    const engine = new PaintEngine()
    engine.commit(stroke())
    expect(isProjectSnapshot(createSnapshot(engine))).toBe(true)
  })

  it.each([
    ['null', null],
    ['an empty object', {}],
    ['a future schema version', { version: 99, width: 1, height: 1, operations: [] }],
    ['a bad width', { version: 1, width: 'x', height: 1, operations: [] }],
    ['an invalid operation', { version: 1, width: 1, height: 1, operations: [{ bad: true }] }],
  ])('rejects %s', (_label, value) => {
    expect(isProjectSnapshot(value)).toBe(false)
  })
})
