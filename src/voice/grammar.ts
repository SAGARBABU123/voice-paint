import type { SketchStyle } from '../paint/sketchStyles'
import type { PaintTool } from '../paint/types'

/**
 * Spoken word -> tool. Used only to build typed commands, never to dispatch
 * freely. English-phrase synonyms (and common slang) map to the same tools.
 */
export const TOOL_ALIASES: Readonly<Record<string, PaintTool>> = {
  pencil: 'pencil',
  pen: 'pencil',
  brush: 'pencil',
  marker: 'pencil',
  'drawing pen': 'pencil',
  pensil: 'pencil',
  eraser: 'eraser',
  erase: 'eraser',
  rubber: 'eraser',
  'rubber band': 'eraser',
  line: 'line',
  'straight line': 'line',
  ray: 'line',
  rectangle: 'rectangle',
  rect: 'rectangle',
  box: 'rectangle',
  square: 'rectangle',
  'long box': 'rectangle',
  ellipse: 'ellipse',
  oval: 'ellipse',
  circle: 'ellipse',
  round: 'ellipse',
  text: 'text',
  type: 'text',
  write: 'text',
  select: 'select',
  marquee: 'select',
}

/** Words that announce a photo-sketch intent. Undefined behavior fails helpfully. */
export const SKETCH_WORDS = ['sketch', 'trace', 'sketching', 'traced'] as const

/** Spoken pencil style -> SketchStyle (all deterministic presets). */
export const SKETCH_STYLE_ALIASES: Readonly<Record<string, SketchStyle>> = {
  charcoal: 'charcoal',
  pencil: 'pencil',
  'coloured pencil': 'colour-pencil',
  'colour pencil': 'colour-pencil',
  'colored pencil': 'colour-pencil',
  'coloured pencils': 'colour-pencil',
  'colour pencils': 'colour-pencil',
  'colored pencils': 'colour-pencil',
  ink: 'ink',
  'ink pen': 'ink',
  'pen and ink': 'ink',
  hatch: 'hatch',
  crosshatch: 'hatch',
  'cross hatch': 'hatch',
}

/** Words that make the next sketch read heavier on the sheet. */
export const SKETCH_DARKER_WORDS = ['darker', 'bolder', 'heavier', 'stronger', 'thicker'] as const
/** Words that make the next sketch read fainter on the sheet. */
export const SKETCH_LIGHTER_WORDS = ['lighter', 'fainter', 'softer', 'weaker', 'thinner'] as const
/** Phrase fragments that request more or less photo detail. */
export const SKETCH_MORE_DETAIL = ['more detail', 'detailed', 'finest', 'fine detail'] as const
export const SKETCH_SIMPLER = ['simpler', 'less detail', 'cleaner', 'minimal'] as const

/** Spoken colour name -> hex value accepted by the engine. */
export const COLOR_NAMES: Readonly<Record<string, string>> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  purple: '#8b5cf6',
  violet: '#8b5cf6',
  pink: '#ec4899',
  brown: '#8b5a2b',
  black: '#000000',
  white: '#ffffff',
  gray: '#78716c',
  grey: '#78716c',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  magenta: '#d946ef',
  maroon: '#800000',
  navy: '#000080',
  gold: '#f59e0b',
  silver: '#c0c0c0',
}

/** Example phrases shown in the in-app "What can I say?" help. */
export const COMMAND_EXAMPLES: readonly string[] = [
  'use pencil',
  'switch to eraser',
  'make a circle',
  'draw a rectangle and fill it blue',
  'fill it red',
  'use the red brush',
  'set color to red',
  'set brush size to 8',
  'make the brush smaller',
  'sketch it in charcoal',
  'sketch it darker',
  'sketch it with more detail',
  'undo',
  'redo',
  'clear canvas',
  'export PNG',
  'what can I say?',
]
