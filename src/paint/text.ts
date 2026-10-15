import { createId } from './id'
import type { TextOperation } from './types'

export const DEFAULT_FONT_FAMILY = 'sans-serif'

/** Font families offered by the text tool (generic CSS families). */
export const FONT_FAMILIES = ['sans-serif', 'serif', 'monospace'] as const
export type FontFamily = (typeof FONT_FAMILIES)[number]

export function isFontFamily(value: unknown): value is FontFamily {
  return typeof value === 'string' && (FONT_FAMILIES as readonly string[]).includes(value)
}

export type CreateTextOperationParams = {
  text: string
  x: number
  y: number
  color: string
  fontSize: number
  fontFamily?: string
  fontWeight?: number
  fontStyle?: 'normal' | 'italic'
}

export function createTextOperation({
  text,
  x,
  y,
  color,
  fontSize,
  fontFamily = DEFAULT_FONT_FAMILY,
  fontWeight = 400,
  fontStyle = 'normal',
}: CreateTextOperationParams): TextOperation {
  return {
    id: createId(),
    kind: 'text',
    x,
    y,
    text,
    color,
    fontSize,
    fontFamily,
    fontWeight,
    fontStyle,
    rotation: 0,
  }
}
