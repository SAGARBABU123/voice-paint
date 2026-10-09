import { describe, expect, it } from 'vitest'
import { isPaintOperation } from './operations'

const stroke = {
  id: 'a',
  kind: 'stroke',
  tool: 'pencil',
  color: '#111111',
  size: 4,
  points: [{ x: 0, y: 0 }],
}
const shape = {
  id: 'b',
  kind: 'shape',
  tool: 'rectangle',
  color: '#111111',
  size: 4,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
}

describe('isPaintOperation', () => {
  it('accepts valid strokes and shapes', () => {
    expect(isPaintOperation(stroke)).toBe(true)
    expect(isPaintOperation(shape)).toBe(true)
  })

  it.each([
    ['null', null],
    ['an empty object', {}],
    ['a bad point', { ...stroke, points: [{ x: 'nope', y: 0 }] }],
    ['an unknown shape tool', { ...shape, tool: 'triangle' }],
    ['an unknown kind', { ...stroke, kind: 'blob' }],
    ['a non-numeric size', { ...stroke, size: 'big' }],
  ])('rejects %s', (_label, value) => {
    expect(isPaintOperation(value)).toBe(false)
  })
})
