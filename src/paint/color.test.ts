import { describe, expect, it } from 'vitest'
import { hexToRgba, shiftToward } from './color'

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

describe('shiftToward', () => {
  it('mixes a colour toward the target by the given amount', () => {
    expect(shiftToward('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(shiftToward('#ffffff', '#000000', 0.25)).toBe('#bfbfbf')
    expect(shiftToward('#ff0000', '#000000', 1)).toBe('#000000')
    expect(shiftToward('#ff0000', '#ffffff', 1)).toBe('#ffffff')
  })

  it('keeps channels in range and clamps the amount', () => {
    expect(shiftToward('#ef4444', '#000000', 0.35)).toBe('#9b2c2c')
    expect(shiftToward('#ef4444', '#ffffff', 0.35)).toBe('#f58585')
    expect(shiftToward('#ef4444', '#000000', 3)).toBe('#000000')
    expect(shiftToward('#ef4444', '#000000', -1)).toBe('#ef4444')
  })

  it('returns a consistent 6-digit lowercase hex', () => {
    expect(shiftToward('#f00', '#000000', 0.5)).toBe('#800000')
    expect(shiftToward('#000', '#fff', 0.5)).toBe('#808080')
  })
})
