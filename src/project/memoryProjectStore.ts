import type { ProjectSnapshot, ProjectStore } from './types'

function clone(snapshot: ProjectSnapshot): ProjectSnapshot {
  if (typeof structuredClone === 'function') return structuredClone(snapshot)
  return JSON.parse(JSON.stringify(snapshot)) as ProjectSnapshot
}

/** Non-persistent store used in tests and when IndexedDB is unavailable. */
export class MemoryProjectStore implements ProjectStore {
  private snapshot: ProjectSnapshot | null = null

  load(): Promise<ProjectSnapshot | null> {
    return Promise.resolve(this.snapshot ? clone(this.snapshot) : null)
  }

  save(snapshot: ProjectSnapshot): Promise<void> {
    this.snapshot = clone(snapshot)
    return Promise.resolve()
  }

  clear(): Promise<void> {
    this.snapshot = null
    return Promise.resolve()
  }
}
