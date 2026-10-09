import type { PaintTool } from '../paint/types'

/** Spoken word -> tool. Used only to build typed commands, never to dispatch freely. */
export const TOOL_ALIASES: Readonly<Record<string, PaintTool>> = {
  pencil: 'pencil',
  pen: 'pencil',
  brush: 'pencil',
  eraser: 'eraser',
  erase: 'eraser',
  rubber: 'eraser',
  line: 'line',
  rectangle: 'rectangle',
  rect: 'rectangle',
  box: 'rectangle',
  square: 'rectangle',
  ellipse: 'ellipse',
  oval: 'ellipse',
  circle: 'ellipse',
}

/** Spoken colour name -> hex value accepted by the engine. */
export const COLOR_NAMES: Readonly<Record<string, string>> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  purple: '#8b5cf6',
  pink: '#ec4899',
  brown: '#8b5a2b',
  black: '#000000',
  white: '#ffffff',
  gray: '#78716c',
  grey: '#78716c',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  magenta: '#d946ef',
}

/** Example phrases shown in the in-app "What can I say?" help. */
export const COMMAND_EXAMPLES: readonly string[] = [
  'use pencil',
  'switch to eraser',
  'draw a rectangle',
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
