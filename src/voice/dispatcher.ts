import { MAX_BRUSH_SIZE, MIN_BRUSH_SIZE } from '../paint/constants'
import type { PaintEngine } from '../paint/engine'
import { clamp } from '../paint/geometry'
import type { PaintCommand } from './types'

export const BRUSH_SIZE_STEP = 2

/** Side effects for commands that are not drawing operations. */
export type CommandEffects = {
  onHelp?: () => void
  onError?: (message: string) => void
}

export type DispatchResult = {
  executed: PaintCommand[]
  pending: PaintCommand[]
}

/**
 * Routes validated commands to the exact same PaintEngine methods the toolbar
 * uses. Destructive commands are never executed here; they are returned as
 * `pending` so the UI can confirm first.
 */
export async function dispatchCommands(
  engine: PaintEngine,
  commands: readonly PaintCommand[],
  effects: CommandEffects = {},
): Promise<DispatchResult> {
  const executed: PaintCommand[] = []
  const pending: PaintCommand[] = []

  for (const command of commands) {
    if (command.type === 'canvas.clear') {
      pending.push(command)
      continue
    }
    await executeCommand(engine, command, effects)
    executed.push(command)
  }

  return { executed, pending }
}

/** Executes a single allowlisted command against the shared engine. */
export async function executeCommand(
  engine: PaintEngine,
  command: PaintCommand,
  effects: CommandEffects = {},
): Promise<void> {
  switch (command.type) {
    case 'tool.select':
      engine.setTool(command.tool)
      return
    case 'shape.draw':
      engine.drawShape(command.tool)
      return
    case 'canvas.fill':
      engine.fillAt({ x: engine.width / 2, y: engine.height / 2 })
      return
    case 'color.set':
      engine.setColor(command.color)
      return
    case 'brush.size.set':
      engine.setBrushSize(command.size)
      return
    case 'brush.size.adjust': {
      const current = engine.getSnapshot().brushSize
      const delta = command.direction === 'larger' ? BRUSH_SIZE_STEP : -BRUSH_SIZE_STEP
      engine.setBrushSize(clamp(current + delta, MIN_BRUSH_SIZE, MAX_BRUSH_SIZE))
      return
    }
    case 'history.undo':
      engine.undo()
      return
    case 'history.redo':
      engine.redo()
      return
    case 'canvas.clear':
      engine.clear()
      return
    case 'canvas.export':
      try {
        await engine.exportPng()
      } catch {
        effects.onError?.('I could not export the PNG in this browser.')
      }
      return
    case 'help.open':
      effects.onHelp?.()
      return
  }
}
