import { useEffect, useRef, useState } from 'react'
import { createSnapshot, isProjectSnapshot } from '../project/serialize'
import { createDefaultProjectStore } from '../project/index'
import type { ProjectStore } from '../project/types'
import { usePaintEngine, usePaintSnapshot } from './PaintProvider'

export type PersistenceStatus = 'loading' | 'ready' | 'saving' | 'saved' | 'error' | 'unavailable'

export const DEFAULT_AUTOSAVE_DELAY_MS = 500

export type UseProjectPersistenceOptions = {
  store?: ProjectStore
  autosaveDelayMs?: number
}

export type ProjectPersistence = {
  status: PersistenceStatus
}

/**
 * Restores the saved drawing on mount and autosaves changes to local storage.
 * The engine stays the single source of truth; this hook only reads snapshots
 * and calls `loadOperations` once, and it never clobbers a drawing the user
 * started before restoration finished.
 */
export function useProjectPersistence(
  options: UseProjectPersistenceOptions = {},
): ProjectPersistence {
  const engine = usePaintEngine()
  const [store] = useState<ProjectStore>(() => options.store ?? createDefaultProjectStore())
  const autosaveDelayMs = options.autosaveDelayMs ?? DEFAULT_AUTOSAVE_DELAY_MS

  const [status, setStatus] = useState<PersistenceStatus>('loading')
  const readyRef = useRef(false)
  const lastSavedRevisionRef = useRef(engine.getSnapshot().revision)
  const revision = usePaintSnapshot().revision

  useEffect(() => {
    let cancelled = false

    const restore = async () => {
      try {
        const snapshot = await store.load()
        if (cancelled) return
        const canRestore =
          snapshot !== null &&
          isProjectSnapshot(snapshot) &&
          engine.getSnapshot().operationCount === 0
        if (canRestore) {
          engine.loadOperations(snapshot.operations)
        }
        lastSavedRevisionRef.current = engine.getSnapshot().revision
        readyRef.current = true
        setStatus('ready')
      } catch {
        if (cancelled) return
        readyRef.current = true
        setStatus('unavailable')
      }
    }

    void restore()
    return () => {
      cancelled = true
    }
  }, [engine, store])

  useEffect(() => {
    if (!readyRef.current) return
    if (revision === lastSavedRevisionRef.current) return

    const timer = window.setTimeout(() => {
      setStatus('saving')
      void (async () => {
        try {
          await store.save(createSnapshot(engine))
          lastSavedRevisionRef.current = engine.getSnapshot().revision
          setStatus('saved')
        } catch {
          setStatus('error')
        }
      })()
    }, autosaveDelayMs)

    return () => window.clearTimeout(timer)
  }, [revision, engine, store, autosaveDelayMs])

  return { status }
}
