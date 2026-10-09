/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'
import type { PaintEngine, PaintSnapshot } from '../paint/engine'

const PaintEngineContext = createContext<PaintEngine | null>(null)

export function PaintEngineProvider({
  engine,
  children,
}: {
  engine: PaintEngine
  children: ReactNode
}) {
  return <PaintEngineContext.Provider value={engine}>{children}</PaintEngineContext.Provider>
}

export function usePaintEngine(): PaintEngine {
  const engine = useContext(PaintEngineContext)
  if (!engine) throw new Error('usePaintEngine must be used inside a PaintEngineProvider')
  return engine
}

export function usePaintSnapshot(): PaintSnapshot {
  const engine = usePaintEngine()
  return useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot)
}
