import { describe, expect, it } from 'vitest'
import { MemoryProjectStore } from './memoryProjectStore'
import type { ProjectSnapshot } from './types'

const snapshot: ProjectSnapshot = { version: 1, width: 960, height: 720, operations: [] }

describe('MemoryProjectStore', () => {
  it('starts empty', async () => {
    expect(await new MemoryProjectStore().load()).toBeNull()
  })

  it('saves and loads an independent copy', async () => {
    const store = new MemoryProjectStore()
    await store.save(snapshot)

    const loaded = await store.load()

    expect(loaded).toEqual(snapshot)
    expect(loaded).not.toBe(snapshot)
  })

  it('clears the stored snapshot', async () => {
    const store = new MemoryProjectStore()
    await store.save(snapshot)
    await store.clear()
    expect(await store.load()).toBeNull()
  })
})
