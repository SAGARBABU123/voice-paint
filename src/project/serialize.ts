import type { PaintEngine } from '../paint/engine'
import { clampLayerOpacity, type Layer } from '../paint/layers'
import type { PaintOperation } from '../paint/types'
import { isPaintOperation } from './operations'
import { PROJECT_SCHEMA_VERSION, type ProjectSnapshot, type SerializedLayer } from './types'

/** Legacy (v1) snapshot: a single flat operation list. */
type LegacySnapshot = {
  version: 1
  width: number
  height: number
  operations: PaintOperation[]
}

function cloneOperation(operation: PaintOperation): PaintOperation {
  if (operation.kind === 'stroke') {
    return { ...operation, points: operation.points.map((point) => ({ ...point })) }
  }
  if (operation.kind === 'shape') {
    return { ...operation, start: { ...operation.start }, end: { ...operation.end } }
  }
  return { ...operation }
}

/** Produces a deep, serialisable copy of the current document (all layers). */
export function createSnapshot(engine: PaintEngine): ProjectSnapshot {
  return {
    version: PROJECT_SCHEMA_VERSION,
    width: engine.width,
    height: engine.height,
    layers: engine.getLayers().map((layer) => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      opacity: layer.opacity,
      operations: layer.operations.map(cloneOperation),
    })),
    activeLayerId: engine.getActiveLayerId(),
  }
}

function isSerializedLayer(value: unknown): value is SerializedLayer {
  if (typeof value !== 'object' || value === null) return false
  const layer = value as Record<string, unknown>
  return (
    typeof layer.id === 'string' &&
    typeof layer.name === 'string' &&
    typeof layer.visible === 'boolean' &&
    typeof layer.opacity === 'number' &&
    Number.isFinite(layer.opacity) &&
    Array.isArray(layer.operations) &&
    layer.operations.every(isPaintOperation)
  )
}

/**
 * Validates an untrusted value. Accepts the current layered schema and the
 * legacy flat schema (v1) so older saved drawings still load.
 */
export function isProjectSnapshot(value: unknown): value is ProjectSnapshot {
  if (typeof value !== 'object' || value === null) return false
  const snapshot = value as Record<string, unknown>

  if (typeof snapshot.width !== 'number' || !Number.isFinite(snapshot.width)) return false
  if (typeof snapshot.height !== 'number' || !Number.isFinite(snapshot.height)) return false

  if (snapshot.version === PROJECT_SCHEMA_VERSION) {
    return Array.isArray(snapshot.layers) && snapshot.layers.every(isSerializedLayer)
  }
  if (snapshot.version === 1) {
    return Array.isArray(snapshot.operations) && snapshot.operations.every(isPaintOperation)
  }
  return false
}

/** Normalises any accepted snapshot to the current layered schema. */
export function normalizeSnapshot(value: unknown): ProjectSnapshot | null {
  if (!isProjectSnapshot(value)) return null
  const snapshot = value as unknown as Record<string, unknown> & { version: number }

  if (snapshot.version === PROJECT_SCHEMA_VERSION) {
    return value as ProjectSnapshot
  }

  const legacy = snapshot as unknown as LegacySnapshot
  return {
    version: PROJECT_SCHEMA_VERSION,
    width: legacy.width,
    height: legacy.height,
    layers: [
      {
        id: 'legacy-layer',
        name: 'Layer 1',
        visible: true,
        opacity: 1,
        operations: legacy.operations,
      },
    ],
    activeLayerId: 'legacy-layer',
  }
}

/** Converts a normalised snapshot's layers into engine layers. */
export function snapshotLayers(snapshot: ProjectSnapshot): Layer[] {
  return snapshot.layers.map((layer) => ({
    id: layer.id,
    name: layer.name,
    visible: layer.visible,
    opacity: clampLayerOpacity(layer.opacity),
    operations: layer.operations.map(cloneOperation),
  }))
}
