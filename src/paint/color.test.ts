import { describe, expect, it } from 'vitest'
import { hexToRgba } from './color'

describe('hexToRgba', () => {
  it('parses a 6-digit hex colour', () => {
    expect(hexToRgba('#ef4444')).toEqual({ r: 239, g: 68, b: 68, a: 255 })
  })

  it('expands a 3-digit hex colour', () => {
    expect(hexToRgba('#abc')).toEqual({ r: 170, g: 187, b: 204, a: 255 })
  })

  it('accepts a hex colour without a leading #', () => {
    expect(hexToRgba('000000')).toEqual({ r: 0, g: 0, b: 0, a: 255 })
  })

  it('falls back to opaque black for invalid input', () => {
    expect(hexToRgba('nope')).toEqual({ r: 0, g: 0, b: 0, a: 255 })
    expect(hexToRgba('#12345')).toEqual({ r: 0, g: 0, b: 0, a: 255 })
    expect(hexToRgba('#gggggg')).toEqual({ r: 0, g: 0, b: 0, a: 255 })
  })
})
