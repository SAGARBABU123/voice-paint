import type { PaintEngine } from '../paint/engine'
import type { PaintOperation } from '../paint/types'
import { isPaintOperation } from './operations'
import { PROJECT_SCHEMA_VERSION, type ProjectSnapshot } from './types'

function cloneOperation(operation: PaintOperation): PaintOperation {
  if (operation.kind === 'stroke') {
    return { ...operation, points: operation.points.map((point) => ({ ...point })) }
  }
  if (operation.kind === 'shape') {
    return { ...operation, start: { ...operation.start }, end: { ...operation.end } }
  }
  return { ...operation }
}

/** Produces a deep, serialisable copy of the current document. */
export function createSnapshot(engine: PaintEngine): ProjectSnapshot {
  return {
    version: PROJECT_SCHEMA_VERSION,
    width: engine.width,
    height: engine.height,
    operations: engine.getOperations().map(cloneOperation),
  }
}

/** Validates an untrusted value before it is applied to the engine. */
export function isProjectSnapshot(value: unknown): value is ProjectSnapshot {
  if (typeof value !== 'object' || value === null) return false
  const snapshot = value as Record<string, unknown>

  if (snapshot.version !== PROJECT_SCHEMA_VERSION) return false
  if (typeof snapshot.width !== 'number' || !Number.isFinite(snapshot.width)) return false
  if (typeof snapshot.height !== 'number' || !Number.isFinite(snapshot.height)) return false
  if (!Array.isArray(snapshot.operations)) return false

  return snapshot.operations.every(isPaintOperation)
}
