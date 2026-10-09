export const PAINT_TOOLS = ['pencil', 'eraser', 'line', 'rectangle', 'ellipse'] as const

export type PaintTool = (typeof PAINT_TOOLS)[number]
export type StrokeTool = Extract<PaintTool, 'pencil' | 'eraser'>
export type ShapeTool = Extract<PaintTool, 'line' | 'rectangle' | 'ellipse'>

export function isPaintTool(value: unknown): value is PaintTool {
  return typeof value === 'string' && (PAINT_TOOLS as readonly string[]).includes(value)
}

export function isStrokeTool(tool: PaintTool): tool is StrokeTool {
  return tool === 'pencil' || tool === 'eraser'
}

export type Point = { x: number; y: number }

export type StrokeOperation = {
  id: string
  kind: 'stroke'
  tool: StrokeTool
  color: string
  size: number
  points: Point[]
}

export type ShapeOperation = {
  id: string
  kind: 'shape'
  tool: ShapeTool
  color: string
  size: number
  start: Point
  end: Point
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

export type PaintOperation = StrokeOperation | ShapeOperation | ImageOperation

export function isImageOperation(operation: PaintOperation): operation is ImageOperation {
  return operation.kind === 'image'
}
