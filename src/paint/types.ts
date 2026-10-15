import { SHAPE_ORDER, isShapeTool, type ShapeTool as ImportedShapeTool } from './shapes'

export const PAINT_TOOLS = [
  'pencil',
  'eraser',
  ...SHAPE_ORDER,
  'text',
  'fill',
  'select',
  'eyedropper',
] as const

export type PaintTool = (typeof PAINT_TOOLS)[number]

/** Pen/line render styles — dash patterns applied to strokes and shapes. */
export const STROKE_STYLES = [
  'solid',
  'dashed',
  'long-dash',
  'dotted',
  'dash-dot',
  'dash-dot-dot',
] as const

export type StrokeStyle = (typeof STROKE_STYLES)[number]

export function isStrokeStyle(value: unknown): value is StrokeStyle {
  return typeof value === 'string' && (STROKE_STYLES as readonly string[]).includes(value)
}
export type StrokeTool = Extract<PaintTool, 'pencil' | 'eraser'>
export type ShapeTool = ImportedShapeTool

export function isPaintTool(value: unknown): value is PaintTool {
  return typeof value === 'string' && (PAINT_TOOLS as readonly string[]).includes(value)
}

export function isStrokeTool(tool: PaintTool): tool is StrokeTool {
  return tool === 'pencil' || tool === 'eraser'
}

export { isShapeTool }

export type Point = { x: number; y: number }

export type StrokeOperation = {
  id: string
  kind: 'stroke'
  tool: StrokeTool
  color: string
  size: number
  points: Point[]
  /** Absent means solid (keeps older saved documents compatible). */
  style?: StrokeStyle
}

export type ShapeOperation = {
  id: string
  kind: 'shape'
  tool: ShapeTool
  color: string
  size: number
  start: Point
  end: Point
  /** Absent means solid (keeps older saved documents compatible). */
  style?: StrokeStyle
  /** Absent/true renders a filled shape; false renders the outline. */
  fill?: boolean
}

/** A raster imported from a file, positioned and scaled in document space. */
export type ImageOperation = {
  id: string
  kind: 'image'
  x: number
  y: number
  width: number
  height: number
  dataUrl: string
}

export type PaintOperation = StrokeOperation | ShapeOperation | ImageOperation | TextOperation

export function isImageOperation(operation: PaintOperation): operation is ImageOperation {
  return operation.kind === 'image'
}

/** Text drawn at a document point. `rotation` is in quarter-turns. */
export type TextOperation = {
  id: string
  kind: 'text'
  x: number
  y: number
  text: string
  color: string
  fontSize: number
  fontFamily: string
  rotation: number
}

export function isTextOperation(operation: PaintOperation): operation is TextOperation {
  return operation.kind === 'text'
}
