import type { PaintOperation, Point } from '../paint/types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isPoint(value: unknown): value is Point {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y)
}

/**
 * Structural validation for persisted/imported operations. Storage is treated as
 * untrusted input so corrupt data can never reach the renderer.
 */
export function isPaintOperation(value: unknown): value is PaintOperation {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string') return false

  if (value.kind === 'stroke') {
    if (typeof value.color !== 'string' || !isFiniteNumber(value.size)) return false
    if (value.tool !== 'pencil' && value.tool !== 'eraser') return false
    return Array.isArray(value.points) && value.points.every(isPoint)
  }

  if (value.kind === 'shape') {
    if (typeof value.color !== 'string' || !isFiniteNumber(value.size)) return false
    if (value.tool !== 'line' && value.tool !== 'rectangle' && value.tool !== 'ellipse') {
      return false
    }
    return isPoint(value.start) && isPoint(value.end)
  }

  if (value.kind === 'image') {
    return (
      isFiniteNumber(value.x) &&
      isFiniteNumber(value.y) &&
      isFiniteNumber(value.width) &&
      isFiniteNumber(value.height) &&
      typeof value.dataUrl === 'string' &&
      value.dataUrl.startsWith('data:image/')
    )
  }

  return false
}
