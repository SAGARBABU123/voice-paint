import { describe, expect, it } from 'vitest'
import { addRecentColor, isHexColor, MAX_RECENT_COLORS, parseRecentColors } from './recentColors'

describe('isHexColor', () => {
  it('accepts 3- and 6-digit hex colours', () => {
    expect(isHexColor('#abc')).toBe(true)
    expect(isHexColor('#ABCDEF')).toBe(true)
    expect(isHexColor('  #123456  ')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isHexColor('red')).toBe(false)
    expect(isHexColor('#12345')).toBe(false)
    expect(isHexColor('#gggggg')).toBe(false)
    expect(isHexColor(42)).toBe(false)
    expect(isHexColor(null)).toBe(false)
  })
})

describe('addRecentColor', () => {
  it('prepends and normalizes to lower-case', () => {
    expect(addRecentColor(['#3b82f6'], '#EF4444')).toEqual(['#ef4444', '#3b82f6'])
  })

  it('moves an existing colour to the front without duplicating', () => {
    expect(addRecentColor(['#ef4444', '#3b82f6'], '#EF4444')).toEqual(['#ef4444', '#3b82f6'])
  })

  it('caps the list at the maximum', () => {
    const full = Array.from(
      { length: MAX_RECENT_COLORS },
      (_, i) => `#${i.toString(16).padStart(6, '0')}`,
    )
    const next = addRecentColor(full, '#ffffff')
    expect(next).toHaveLength(MAX_RECENT_COLORS)
    expect(next[0]).toBe('#ffffff')
    expect(next).not.toContain(full[full.length - 1])
  })

  it('ignores invalid colours', () => {
    expect(addRecentColor(['#123456'], 'nope')).toEqual(['#123456'])
  })
})

describe('parseRecentColors', () => {
  it('filters invalid entries and de-duplicates, preserving order', () => {
    expect(parseRecentColors(['#123456', 'bad', '#123456', '#abcdef'])).toEqual([
      '#123456',
      '#abcdef',
    ])
  })

  it('returns an empty list for non-arrays', () => {
    expect(parseRecentColors(null)).toEqual([])
    expect(parseRecentColors('#123456')).toEqual([])
  })

  it('caps the list', () => {
    const many = Array.from({ length: 20 }, (_, i) => `#${i.toString(16).padStart(6, '0')}`)
    expect(parseRecentColors(many)).toHaveLength(MAX_RECENT_COLORS)
  })
})
