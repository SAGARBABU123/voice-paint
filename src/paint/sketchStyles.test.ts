import { describe, expect, it } from 'vitest'
import {
  SKETCH_PRESETS,
  isSketchDetail,
  isSketchStyle,
  isSketchWeight,
  resolveSketchStyle,
} from './sketchStyles'

const base = { color: '#ef4444', size: 2, strokeStyle: 'solid' as const }

describe('sketch style guards', () => {
  it('recognises every exposed style/weight/detail', () => {
    expect(isSketchStyle('charcoal')).toBe(true)
    expect(isSketchStyle('colour-pencil')).toBe(true)
    expect(isSketchStyle('spray')).toBe(false)
    expect(isSketchStyle(4)).toBe(false)

    expect(isSketchWeight('darker')).toBe(true)
    expect(isSketchWeight('bold')).toBe(false)

    expect(isSketchDetail('more')).toBe(true)
    expect(isSketchDetail('greatest')).toBe(false)
  })
})

describe('resolveSketchStyle — style presets', () => {
  it.each([
    ['pencil', 0.7, 0.28],
    ['charcoal', 1.35, 0.32],
    ['colour-pencil', 0.35, 0.26],
    ['ink', 0.05, 0.3],
    ['hatch', 0.9, 0.3],
  ] as const)('%s keeps its documented roughness/threshold', (style, roughness, threshold) => {
    const preset = SKETCH_PRESETS[style]
    expect(preset.roughness).toBe(roughness)
    expect(preset.threshold).toBe(threshold)
  })

  it('follows the active pen colour unless the style overrides it', () => {
    expect(resolveSketchStyle('pencil', 'normal', 'normal', base).color).toBe('#ef4444')
    expect(resolveSketchStyle('colour-pencil', 'normal', 'normal', base).color).toBe('#ef4444')
    expect(resolveSketchStyle('hatch', 'normal', 'normal', base).color).toBe('#ef4444')
    // Charcoal and ink bring their own dark sticks.
    expect(resolveSketchStyle('charcoal', 'normal', 'normal', base).color).toBe('#2b2a33')
    expect(resolveSketchStyle('ink', 'normal', 'normal', base).color).toBe('#1f2430')
  })

  it('applies the dash style for hatch and solid everywhere else', () => {
    expect(resolveSketchStyle('hatch', 'normal', 'normal', base).style).toBe('dashed')
    expect(resolveSketchStyle('pencil', 'normal', 'normal', base).style).toBe('solid')
  })

  it('scales the stroke width per style and clamps to a sane range', () => {
    expect(resolveSketchStyle('charcoal', 'normal', 'normal', { ...base, size: 3 }).size).toBe(5) // 3 × 1.5
    expect(resolveSketchStyle('ink', 'normal', 'normal', { ...base, size: 2 }).size).toBe(1) // 2 × 0.55 → 1
    expect(resolveSketchStyle('charcoal', 'normal', 'normal', { ...base, size: 6 }).size).toBe(6) // clamped
  })
})

describe('resolveSketchStyle — weight and detail knobs', () => {
  it('darkens the stroke colour and thickens the pencil for darker', () => {
    const result = resolveSketchStyle('pencil', 'darker', 'normal', base)
    expect(result.size).toBe(3) // 2 × 1 × 1.3 → 2.6 rounds to 3
    expect(result.color).not.toBe('#ef4444')
    expect(Number.parseInt(result.color.slice(1, 3), 16)).toBeLessThan(0xef) // red channel dropped
  })

  it('lightens the stroke colour and thins the pencil for lighter', () => {
    const result = resolveSketchStyle('pencil', 'lighter', 'normal', base)
    expect(result.size).toBe(2) // 2 × 0.75 → 1.5 rounds to 2
    expect(Number.parseInt(result.color.slice(1, 3), 16)).toBeGreaterThan(0xef)
  })

  it('keeps the weight neutral for normal', () => {
    const result = resolveSketchStyle('pencil', 'normal', 'normal', base)
    expect(result).toMatchObject({ color: '#ef4444', size: 2 })
  })

  it('shifts the edge sensitivity for detail without leaving the safe band', () => {
    expect(resolveSketchStyle('pencil', 'normal', 'more', base).threshold).toBeCloseTo(0.21)
    expect(resolveSketchStyle('pencil', 'normal', 'simpler', base).threshold).toBeCloseTo(0.36)
    // Even combined with an extreme preset the threshold stays in [0.08, 0.62].
    const charcoalMore = resolveSketchStyle('charcoal', 'normal', 'more', base)
    expect(charcoalMore.threshold).toBeGreaterThanOrEqual(0.08)
    expect(charcoalMore.threshold).toBeLessThanOrEqual(0.62)
  })

  it('combines style, weight, and detail deterministically', () => {
    const a = resolveSketchStyle('charcoal', 'darker', 'more', base)
    const b = resolveSketchStyle('charcoal', 'darker', 'more', base)
    expect(a).toEqual(b)
    expect(a.roughness).toBe(1.35)
  })
})
