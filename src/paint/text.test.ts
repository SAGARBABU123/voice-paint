import { describe, expect, it } from 'vitest'
import { createTextOperation, DEFAULT_FONT_FAMILY } from './text'

describe('createTextOperation', () => {
  it('builds a text operation with defaults', () => {
    const operation = createTextOperation({
      text: 'Hello',
      x: 10,
      y: 20,
      color: '#111111',
      fontSize: 24,
    })

    expect(operation).toMatchObject({
      kind: 'text',
      text: 'Hello',
      x: 10,
      y: 20,
      color: '#111111',
      fontSize: 24,
      fontFamily: DEFAULT_FONT_FAMILY,
      rotation: 0,
    })
    expect(operation.id).toBeTruthy()
  })

  it('accepts a custom font family', () => {
    const operation = createTextOperation({
      text: 'Hi',
      x: 0,
      y: 0,
      color: '#000000',
      fontSize: 12,
      fontFamily: 'serif',
    })
    expect(operation.fontFamily).toBe('serif')
  })

  it('gives each operation a unique id', () => {
    const first = createTextOperation({ text: 'a', x: 0, y: 0, color: '#000000', fontSize: 12 })
    const second = createTextOperation({ text: 'b', x: 0, y: 0, color: '#000000', fontSize: 12 })
    expect(first.id).not.toBe(second.id)
  })
})
