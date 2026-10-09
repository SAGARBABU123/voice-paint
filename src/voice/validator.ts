import { MAX_BRUSH_SIZE, MIN_BRUSH_SIZE } from '../paint/constants'
import { clamp } from '../paint/geometry'
import { MAX_SHAPES, type ShapePlacement } from '../paint/placement'
import { isPaintTool, isShapeTool } from '../paint/types'
import type { CommandValidationResult, PaintCommand, ValidationFailureReason } from './types'

const PLACEMENTS: readonly ShapePlacement[] = [
  'center',
  'row',
  'top',
  'bottom',
  'left',
  'right',
  'corners',
  'sides',
]

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/

type SingleValidation =
  | { ok: true; command: PaintCommand }
  | { ok: false; reason: ValidationFailureReason; message: string }

function invalid(message: string): SingleValidation {
  return { ok: false, reason: 'invalid_parameter', message }
}

/**
 * Re-checks every command name and parameter against the allowlist, ranges, and
 * action policy. This is defence in depth: even a hand-built command cannot
 * smuggle an unsupported tool, non-hex colour, or out-of-range size.
 */
export function validateCommands(commands: readonly PaintCommand[]): CommandValidationResult {
  if (commands.length === 0) {
    return { ok: false, reason: 'unsupported_command', message: 'There was no command to run.' }
  }

  const validated: PaintCommand[] = []
  for (const command of commands) {
    const result = validateCommand(command)
    if (!result.ok) return result
    validated.push(result.command)
  }

  return {
    ok: true,
    commands: validated,
    requiresConfirmation: validated.some((command) => command.type === 'canvas.clear'),
  }
}

function validateCommand(command: PaintCommand): SingleValidation {
  switch (command.type) {
    case 'tool.select':
      if (!isPaintTool(command.tool)) return invalid(`"${String(command.tool)}" is not a tool.`)
      return { ok: true, command }

    case 'shape.draw': {
      if (!isShapeTool(command.tool)) {
        return invalid(`"${String(command.tool)}" is not a shape I can draw.`)
      }
      const count =
        command.count === undefined ? undefined : clamp(Math.round(command.count), 1, MAX_SHAPES)
      const placement = command.placement ?? 'center'
      if (!PLACEMENTS.includes(placement)) {
        return invalid(`"${placement}" is not a placement I know.`)
      }
      return { ok: true, command: { ...command, count, placement } }
    }

    case 'canvas.fill':
      return { ok: true, command }

    case 'color.set': {
      const color = command.color.trim().toLowerCase()
      if (!HEX_COLOR.test(color)) return invalid(`"${command.color}" is not a valid colour.`)
      return { ok: true, command: { ...command, color } }
    }

    case 'brush.size.set': {
      if (!Number.isFinite(command.size)) return invalid('That brush size is not a number.')
      const size = clamp(Math.round(command.size), MIN_BRUSH_SIZE, MAX_BRUSH_SIZE)
      return { ok: true, command: { ...command, size } }
    }

    case 'brush.size.adjust':
      if (command.direction !== 'smaller' && command.direction !== 'larger') {
        return invalid('That brush size change is not supported.')
      }
      return { ok: true, command }

    case 'history.undo':
    case 'history.redo':
    case 'canvas.clear':
      return { ok: true, command }

    case 'canvas.export':
      if (command.format !== 'png') return invalid('Only PNG export is supported.')
      return { ok: true, command }

    case 'help.open':
      return { ok: true, command }
  }
}
