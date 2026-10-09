/** Logical document resolution. The canvas element uses these as its backing store. */
export const DOCUMENT_WIDTH = 960
export const DOCUMENT_HEIGHT = 720

/** Opaque background painted on every render. The eraser paints this colour. */
export const BACKGROUND_COLOR = '#ffffff'

export const DEFAULT_COLOR = '#111111'
export const DEFAULT_BRUSH_SIZE = 4

/** Documented, validated brush/line width limits. */
export const MIN_BRUSH_SIZE = 1
export const MAX_BRUSH_SIZE = 64

/** Default and documented, validated text size limits (pixels). */
export const DEFAULT_FONT_SIZE = 24
export const MIN_FONT_SIZE = 8
export const MAX_FONT_SIZE = 200

export const COLOR_PALETTE = [
  '#111111',
  '#ffffff',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#78716c',
] as const
