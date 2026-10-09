import type { PaintOperation } from '../paint/types'

export const PROJECT_SCHEMA_VERSION = 1
export const PROJECT_DATABASE_NAME = 'voice-over-paint'
export const PROJECT_STORE_NAME = 'state'
export const PROJECT_RECORD_KEY = 'current'

/** Everything needed to restore a drawing session. Operations are plain JSON. */
export type ProjectSnapshot = {
  version: number
  width: number
  height: number
  operations: PaintOperation[]
}

/**
 * Persistence boundary. The IndexedDB implementation is used in the browser and
 * an in-memory implementation stands in for tests and environments without
 * IndexedDB.
 */
export interface ProjectStore {
  load(): Promise<ProjectSnapshot | null>
  save(snapshot: ProjectSnapshot): Promise<void>
  clear(): Promise<void>
}
