import { IndexedDbProjectStore } from './indexedDbProjectStore'
import { MemoryProjectStore } from './memoryProjectStore'
import type { ProjectStore } from './types'

/** Uses IndexedDB where available, falling back to memory (no persistence). */
export function createDefaultProjectStore(): ProjectStore {
  if (typeof indexedDB === 'undefined') return new MemoryProjectStore()
  return new IndexedDbProjectStore()
}

export { IndexedDbProjectStore } from './indexedDbProjectStore'
export { MemoryProjectStore } from './memoryProjectStore'
export { createSnapshot, isProjectSnapshot } from './serialize'
export { isPaintOperation } from './operations'
export type { ProjectSnapshot, ProjectStore } from './types'
