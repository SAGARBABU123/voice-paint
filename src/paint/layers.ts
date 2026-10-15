import { createId } from './id'
import type { PaintOperation } from './types'

/** A stacking layer: its own operation list plus visibility and opacity. */
export type Layer = {
  id: string
  name: string
  visible: boolean
  opacity: number
  operations: PaintOperation[]
}

export function createLayer(name: string): Layer {
  return { id: createId(), name, visible: true, opacity: 1, operations: [] }
}

/** The active layer, falling back to the bottom-most layer. */
export function activeLayer(layers: readonly Layer[], activeLayerId: string): Layer {
  return layers.find((layer) => layer.id === activeLayerId) ?? layers[0]
}

export function layerById(layers: readonly Layer[], id: string): Layer | undefined {
  return layers.find((layer) => layer.id === id)
}

export function totalOperations(layers: readonly Layer[]): number {
  return layers.reduce((total, layer) => total + layer.operations.length, 0)
}

/** Immutably replaces one layer's operation list. */
export function withLayerOperations(
  layers: readonly Layer[],
  id: string,
  operations: readonly PaintOperation[],
): Layer[] {
  return layers.map((layer) =>
    layer.id === id ? { ...layer, operations: [...operations] } : layer,
  )
}

/** Maps every layer's operations through a transform (rotate/resize/crop). */
export function mapLayerOperations(
  layers: readonly Layer[],
  transform: (operations: readonly PaintOperation[]) => PaintOperation[],
): Layer[] {
  return layers.map((layer) => ({ ...layer, operations: transform(layer.operations) }))
}

export function clampLayerOpacity(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.max(0, Math.min(1, value))
}
