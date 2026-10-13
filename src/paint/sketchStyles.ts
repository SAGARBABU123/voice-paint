import { shiftToward } from './color'
import type { StrokeStyle } from './types'

/**
 * Named sketch "pencils" — deterministic presets over the OpenCV + rough.js
 * conversion pipeline. They map to the exact options `sketchImage` already
 * accepts (roughness, threshold, size, colour, dash style), so both the
 * toolbar and voice commands resolve through this single pure function.
 */
export const SKETCH_STYLES = ['pencil', 'charcoal', 'colour-pencil', 'ink', 'hatch'] as const

export type SketchStyle = (typeof SKETCH_STYLES)[number]

/** How heavy the pencil looks on the sheet. */
export const SKETCH_WEIGHTS = ['lighter', 'normal', 'darker'] as const
export type SketchWeight = (typeof SKETCH_WEIGHTS)[number]

/** How much of the photo's detail the conversion keeps. */
export const SKETCH_DETAILS = ['simpler', 'normal', 'more'] as const
export type SketchDetail = (typeof SKETCH_DETAILS)[number]

export function isSketchStyle(value: unknown): value is SketchStyle {
  return typeof value === 'string' && (SKETCH_STYLES as readonly string[]).includes(value)
}

export function isSketchWeight(value: unknown): value is SketchWeight {
  return typeof value === 'string' && (SKETCH_WEIGHTS as readonly string[]).includes(value)
}

export function isSketchDetail(value: unknown): value is SketchDetail {
  return typeof value === 'string' && (SKETCH_DETAILS as readonly string[]).includes(value)
}

export const SKETCH_STYLE_LABELS: Record<SketchStyle, string> = {
  pencil: 'Pencil',
  charcoal: 'Charcoal',
  'colour-pencil': 'Colour pencil',
  ink: 'Ink',
  hatch: 'Hatch',
}

export const SKETCH_WEIGHT_LABELS: Record<SketchWeight, string> = {
  lighter: 'Lighter',
  normal: 'Normal',
  darker: 'Darker',
}

export const SKETCH_DETAIL_LABELS: Record<SketchDetail, string> = {
  simpler: 'Simpler',
  normal: 'Normal',
  more: 'More',
}

export type SketchStylePreset = {
  /** rough.js roughness (0 = smooth curves, higher = sketchier lines). */
  roughness: number
  /** Canny sensitivity baseline (0..1, lower = more edges/detail). */
  threshold: number
  /** Stroke-width multiplier over the pen size. */
  sizeFactor: number
  /** Overrides the active colour (charcoal/ink), or null to follow the pen. */
  colorOverride: string | null
  /** Dash pattern applied to the strokes. */
  strokeStyle: StrokeStyle
}

export type SketchWeightInfo = {
  /** Colour shift applied to the stroke colour (lighter/darker). */
  shift: { target: string; amount: number } | null
  /** Stroke-width multiplier. */
  sizeFactor: number
}

export const SKETCH_PRESETS: Record<SketchStyle, SketchStylePreset> = {
  pencil: {
    roughness: 0.7,
    threshold: 0.28,
    sizeFactor: 1,
    colorOverride: null,
    strokeStyle: 'solid',
  },
  charcoal: {
    roughness: 1.35,
    threshold: 0.32,
    sizeFactor: 1.5,
    colorOverride: '#2b2a33',
    strokeStyle: 'solid',
  },
  'colour-pencil': {
    roughness: 0.35,
    threshold: 0.26,
    sizeFactor: 0.85,
    colorOverride: null,
    strokeStyle: 'solid',
  },
  ink: {
    roughness: 0.05,
    threshold: 0.3,
    sizeFactor: 0.55,
    colorOverride: '#1f2430',
    strokeStyle: 'solid',
  },
  hatch: {
    roughness: 0.9,
    threshold: 0.3,
    sizeFactor: 1.1,
    colorOverride: null,
    strokeStyle: 'dashed',
  },
}

export const SKETCH_WEIGHTS_INFO: Record<SketchWeight, SketchWeightInfo> = {
  lighter: { shift: { target: '#ffffff', amount: 0.35 }, sizeFactor: 0.75 },
  normal: { shift: null, sizeFactor: 1 },
  darker: { shift: { target: '#000000', amount: 0.35 }, sizeFactor: 1.3 },
}

const DETAIL_THRESHOLD_DELTA: Record<SketchDetail, number> = {
  simpler: 0.08,
  normal: 0,
  more: -0.07,
}

const MIN_THRESHOLD = 0.08
const MAX_THRESHOLD = 0.62

/** Base values `sketchImage` needs, resolved from the active sketch preferences. */
export type SketchPrefs = {
  color: string
  /** Stroke width in px (sketchImage range is ~1..6 after scaling). */
  size: number
  roughness: number
  threshold: number
  style: StrokeStyle
}

/**
 * Resolves the active sketch style/weight/detail — set by the toolbar or by
 * voice ("sketch it in charcoal", "sketch it darker") — into the conversion
 * options the pipeline already understands. Pure and deterministic.
 */
export function resolveSketchStyle(
  style: SketchStyle,
  weight: SketchWeight,
  detail: SketchDetail,
  base: { color: string; size: number; strokeStyle: StrokeStyle },
): SketchPrefs {
  const preset = SKETCH_PRESETS[style]
  const weightInfo = SKETCH_WEIGHTS_INFO[weight]
  const detailDelta = DETAIL_THRESHOLD_DELTA[detail]

  const baseColor = preset.colorOverride ?? base.color
  const color = weightInfo.shift
    ? shiftToward(baseColor, weightInfo.shift.target, weightInfo.shift.amount)
    : baseColor

  const size = Math.max(
    1,
    Math.min(6, Math.round(base.size * preset.sizeFactor * weightInfo.sizeFactor)),
  )
  const threshold = Math.max(MIN_THRESHOLD, Math.min(MAX_THRESHOLD, preset.threshold + detailDelta))

  return {
    color,
    size,
    roughness: preset.roughness,
    threshold,
    style: preset.strokeStyle,
  }
}
