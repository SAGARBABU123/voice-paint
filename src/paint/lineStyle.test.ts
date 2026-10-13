import { describe, expect, it } from 'vitest'
import { dashPattern, previewDashArray, strokeStyleLabel } from './lineStyle'
import { STROKE_STYLES } from './types'

describe('line styles', () => {
  it('exposes every style with a label', () => {
    expect(STROKE_STYLES).toEqual([
      'solid',
      'dashed',
      'long-dash',
      'dotted',
      'dash-dot',
      'dash-dot-dot',
    ])
    expect(strokeStyleLabel('dotted')).toBe('Dotted')
    expect(strokeStyleLabel('dash-dot-dot')).toBe('Dash-dot-dot')
  })

  it('solid produces no dash', () => {
    expect(dashPattern('solid', 4)).toEqual([])
  })

  it('produces an even-length dash array for each pattern', () => {
    for (const style of STROKE_STYLES) {
      const pattern = dashPattern(style, 4)
      expect(pattern.length % 2).toBe(0)
    }
  })

  it('scales dashes with the stroke size', () => {
    expect(dashPattern('dashed', 8)).toEqual([16, 8])
    expect(dashPattern('dashed', 2)).toEqual([8, 4])
  })

  it('renders dotted as near-zero dash + gap for round-cap dots', () => {
    const [dash, gap] = dashPattern('dotted', 4)
    expect(dash).toBeLessThan(1)
    expect(gap).toBeGreaterThan(0)
  })

  it('provides svg dash arrays for previews', () => {
    expect(previewDashArray('solid')).toBe('')
    expect(previewDashArray('dashed')).toBe('7 5')
  })
})
