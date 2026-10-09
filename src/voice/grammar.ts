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
  'undo',
  'redo',
  'clear canvas',
  'export PNG',
  'what can I say?',
]
