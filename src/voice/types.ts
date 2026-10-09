import type { PaintTool } from '../paint/types'

/**
 * The fixed, allowlisted command set. Voice never produces anything outside
 * this union, and every command maps 1:1 to a PaintEngine method.
 */
export type PaintCommand =
  | { type: 'tool.select'; tool: PaintTool }
  | { type: 'color.set'; color: string }
  | { type: 'brush.size.set'; size: number }
  | { type: 'brush.size.adjust'; direction: 'smaller' | 'larger' }
  | { type: 'history.undo' }
  | { type: 'history.redo' }
  | { type: 'canvas.clear' }
  | { type: 'canvas.export'; format: 'png' }
  | { type: 'help.open' }

export type ParseFailureReason = 'unknown' | 'ambiguous' | 'missing_parameter'

/**
 * Parser output. A phrase may resolve to more than one command (for example
 * "use the red brush" selects a colour and a tool), so this returns a list.
 * Failures carry a user-facing message and never mutate the drawing.
 */
export type CommandParseResult =
  | { ok: true; commands: PaintCommand[] }
  | { ok: false; reason: ParseFailureReason; message: string }

export type ValidationFailureReason = 'invalid_parameter' | 'unsupported_command'

export type CommandValidationResult =
  | { ok: true; commands: PaintCommand[]; requiresConfirmation: boolean }
  | { ok: false; reason: ValidationFailureReason; message: string }
