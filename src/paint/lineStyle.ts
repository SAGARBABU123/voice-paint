import type { StrokeStyle } from './types'

const STYLE_LABELS: Record<StrokeStyle, string> = {
  solid: 'Solid',
  dashed: 'Dashed',
  'long-dash': 'Long dash',
  dotted: 'Dotted',
  'dash-dot': 'Dash-dot',
  'dash-dot-dot': 'Dash-dot-dot',
}

export function strokeStyleLabel(style: StrokeStyle): string {
  return STYLE_LABELS[style]
}

/**
 * Dash pattern for a line style, scaled to the stroke width so thick pens
 * keep proportional dashes. Solid returns an empty array (no dash).
 * Dotted uses near-zero dashes with round caps, which render as dots.
 */
export function dashPattern(style: StrokeStyle, size: number): number[] {
  const s = Math.max(1, size / 4)
  switch (style) {
    case 'solid':
      return []
    case 'dashed':
      return [8 * s, 4 * s]
    case 'long-dash':
      return [16 * s, 6 * s]
    case 'dotted':
      return [0.5 * s, 5 * s]
    case 'dash-dot':
      return [6 * s, 4 * s, 1 * s, 4 * s]
    case 'dash-dot-dot':
      return [8 * s, 4 * s, 1 * s, 4 * s, 1 * s, 4 * s]
  }
}

/** Applies a line style to the canvas context (dash array + round caps). */
export function applyLineStyle(
  ctx: CanvasRenderingContext2D,
  style: StrokeStyle,
  size: number,
): void {
  ctx.setLineDash(dashPattern(style, size))
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

/** SVG dash array for the tiny previews in the style menu. */
export function previewDashArray(style: StrokeStyle): string {
  switch (style) {
    case 'solid':
      return ''
    case 'dashed':
      return '7 5'
    case 'long-dash':
      return '15 7'
    case 'dotted':
      return '0.1 6'
    case 'dash-dot':
      return '6 5 1 5'
    case 'dash-dot-dot':
      return '9 5 1 5 1 5'
  }
}
