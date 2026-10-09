import { createId } from './id'
import type { TextOperation } from './types'

export const DEFAULT_FONT_FAMILY = 'sans-serif'

export type CreateTextOperationParams = {
  text: string
  x: number
  y: number
  color: string
  fontSize: number
  fontFamily?: string
}

export function createTextOperation({
  text,
  x,
  y,
  color,
  fontSize,
  fontFamily = DEFAULT_FONT_FAMILY,
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
    rotation: 0,
  }
}
