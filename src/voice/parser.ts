import { isShapeTool, type PaintTool } from '../paint/types'
import type { ShapePlacement } from '../paint/placement'
import { COLOR_NAMES, TOOL_ALIASES } from './grammar'
import type { CommandParseResult, ParseFailureReason, PaintCommand } from './types'

const SIZE_WORDS = ['size', 'width'] as const
const BRUSH_WORDS = ['brush', 'line', 'stroke'] as const
const DRAW_WORDS = ['draw', 'add', 'create', 'make', 'place', 'put', 'give'] as const
const FILL_WORDS = ['fill', 'bucket', 'flood'] as const
const INSIDE_WORDS = ['inside', 'within'] as const
const UNDO_WORDS = ['undo', 'revert'] as const
const REDO_WORDS = ['redo', 'restore', 'repeat'] as const
const CLEAR_WORDS = ['clear', 'wipe', 'empty'] as const
const EXPORT_WORDS = ['export', 'download'] as const
const SAVE_WORDS = ['save'] as const
const FILE_WORDS = ['png', 'image', 'picture', 'file'] as const
const HELP_WORDS = ['help'] as const
const WHY_WORDS = ['color', 'colour', 'shade'] as const
const SMALLER_WORDS = ['smaller', 'thinner', 'decrease', 'shrink'] as const
const LARGER_WORDS = ['bigger', 'larger', 'thicker', 'increase', 'grow'] as const
const ACTION_WORDS = ['use', 'switch', 'select', 'choose', 'draw', 'set', 'change', 'make'] as const

const NUMBER_WORDS: Readonly<Record<string, number>> = {
  a: 1,
  one: 1,
  two: 2,
  couple: 2,
  three: 3,
  few: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  dozen: 12,
}

/** Connectors that join clauses (English). */
const CONNECTORS: readonly [string, boolean][] = [
  ['and', true],
  ['then', true],
  ['also', true],
  ['plus', true],
]

/** Lowercases, strips punctuation (keeping `#`), and collapses whitespace. */
export function normalizeTranscript(transcript: string): string {
  return transcript
    .toLowerCase()
    .replace(/[^a-z0-9#\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Splits a phrase into clauses at the known connectors. */
function splitClauses(text: string): string[] {
  const pattern = CONNECTORS.map(([word, boundary]) =>
    boundary ? `\\b${escapeRegExp(word)}\\b` : escapeRegExp(word),
  ).join('|')
  return text
    .split(new RegExp(`(?:${pattern})`))
    .map((clause) => clause.trim())
    .filter((clause) => clause.length > 0)
}

function hasWord(text: string, word: string): boolean {
  return text.split(/\s+/).includes(word)
}

function hasAny(text: string, words: readonly string[]): boolean {
  return words.some((word) => hasWord(text, word))
}

function firstNumber(text: string): number | null {
  const match = text.match(/\d{1,3}/)
  return match ? Number(match[0]) : null
}

/** Simple English pluralisation of a tool token. */
function pluralOf(word: string): string {
  if (word.endsWith('y')) return `${word.slice(0, -1)}ies`
  if (/[sxz]$/.test(word) || /(ch|sh)$/.test(word)) return `${word}es`
  return `${word}s`
}

/** Matches a tool alias allowing plurals ("circles" matches "circle"). */
function tokenMatches(text: string, word: string): boolean {
  return hasWord(text, word) || hasWord(text, pluralOf(word))
}

function findTool(text: string): PaintTool | null {
  for (const [word, tool] of Object.entries(TOOL_ALIASES)) {
    if (tokenMatches(text, word)) return tool
  }
  return null
}

function findColor(text: string): string | null {
  for (const [word, hex] of Object.entries(COLOR_NAMES)) {
    if (hasWord(text, word)) return hex
  }
  return null
}

function isShapeTokenAt(tokens: string[], index: number): boolean {
  const token = tokens[index]
  return Object.keys(TOOL_ALIASES).some((alias) => {
    if (alias !== token && pluralOf(alias) !== token) return false
    const tool = TOOL_ALIASES[alias]
    return tool === 'line' || tool === 'rectangle' || tool === 'ellipse'
  })
}

/** Number of shapes: the numeral/number-word nearest before a shape token. */
function extractCount(tokens: string[]): number {
  const numbers: { index: number; value: number }[] = []
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (/^\d{1,2}$/.test(token)) numbers.push({ index, value: Number(token) })
    else if (token in NUMBER_WORDS) numbers.push({ index, value: NUMBER_WORDS[token] })
  }
  if (numbers.length === 0) return 1

  let best = numbers[0]
  let bestDistance = Number.POSITIVE_INFINITY
  for (const number of numbers) {
    for (let index = number.index + 1; index < tokens.length; index += 1) {
      if (isShapeTokenAt(tokens, index)) {
        const distance = index - number.index
        if (distance < bestDistance) {
          bestDistance = distance
          best = number
        }
        break
      }
    }
  }
  return Math.max(1, Math.min(20, best.value || 1))
}

function placementFrom(text: string, count: number): ShapePlacement {
  if (hasWord(text, 'corners') || hasWord(text, 'corner')) return 'corners'
  if (hasWord(text, 'top')) return 'top'
  if (hasWord(text, 'bottom')) return 'bottom'
  if (hasWord(text, 'left')) return 'left'
  if (hasWord(text, 'right')) return 'right'
  if (hasWord(text, 'sides') || hasWord(text, 'side') || hasWord(text, 'around')) return 'sides'
  return count > 1 ? 'row' : 'center'
}

function failure(reason: ParseFailureReason, message: string): CommandParseResult {
  return { ok: false, reason, message }
}

function ok(commands: PaintCommand[]): CommandParseResult {
  return { ok: true, commands }
}

/**
 * Parses a single clause into allowlisted commands. It only ever returns typed
 * commands or a structured failure and never executes anything.
 */
function parseClause(text: string): CommandParseResult {
  if (!text) {
    return failure('unknown', 'I did not catch that. Try saying "use pencil".')
  }

  if (hasAny(text, UNDO_WORDS) && hasAny(text, REDO_WORDS)) {
    return failure('ambiguous', 'Did you mean "undo" or "redo"? Please say one.')
  }

  if (hasAny(text, CLEAR_WORDS)) {
    return ok([{ type: 'canvas.clear' }])
  }

  if (
    hasAny(text, HELP_WORDS) ||
    /what can i say/.test(text) ||
    (hasWord(text, 'show') && hasWord(text, 'commands'))
  ) {
    return ok([{ type: 'help.open' }])
  }

  if (hasAny(text, EXPORT_WORDS)) {
    return ok([{ type: 'canvas.export', format: 'png' }])
  }

  if (hasAny(text, UNDO_WORDS)) return ok([{ type: 'history.undo' }])
  if (hasAny(text, REDO_WORDS)) return ok([{ type: 'history.redo' }])

  if (hasAny(text, SMALLER_WORDS)) {
    return ok([{ type: 'brush.size.adjust', direction: 'smaller' }])
  }
  if (hasAny(text, LARGER_WORDS)) {
    return ok([{ type: 'brush.size.adjust', direction: 'larger' }])
  }

  const tool = findTool(text)
  const color = findColor(text)
  const tokens = text.split(/\s+/)

  if (hasAny(text, SIZE_WORDS) || (hasAny(text, BRUSH_WORDS) && /\d/.test(text))) {
    const size = firstNumber(text)
    if (size === null) {
      return failure('missing_parameter', 'What brush size? Try "set brush size to 8".')
    }
    return ok([{ type: 'brush.size.set', size }])
  }

  // Fill: colour, if named, is applied first so the fill uses it.
  if (hasAny(text, FILL_WORDS)) {
    const commands: PaintCommand[] = []
    if (color) commands.push({ type: 'color.set', color })
    commands.push({ type: 'canvas.fill' })
    return ok(commands)
  }

  // Draw a shape: colour first, then count/placement, then an inside fill.
  if (hasAny(text, DRAW_WORDS)) {
    if (tool && isShapeTool(tool)) {
      const count = extractCount(tokens)
      const placement = placementFrom(text, count)
      const fillInside = hasAny(text, INSIDE_WORDS) && color
      const commands: PaintCommand[] = []
      if (color) commands.push({ type: 'color.set', color })
      commands.push({ type: 'shape.draw', tool, count, placement })
      if (fillInside) commands.push({ type: 'canvas.fill' })
      return ok(commands)
    }
    if (!color) {
      return failure('missing_parameter', 'What should I draw? Try "draw a circle".')
    }
  }

  if (hasAny(text, SAVE_WORDS) && hasAny(text, FILE_WORDS)) {
    return ok([{ type: 'canvas.export', format: 'png' }])
  }

  if (tool && color) {
    return ok([
      { type: 'color.set', color },
      { type: 'tool.select', tool },
    ])
  }
  if (tool) return ok([{ type: 'tool.select', tool }])
  if (color) return ok([{ type: 'color.set', color }])

  if (hasAny(text, WHY_WORDS)) {
    return failure('missing_parameter', 'Which colour? Try "set color to red".')
  }
  if (hasAny(text, SIZE_WORDS)) {
    return failure('missing_parameter', 'What brush size? Try "set brush size to 8".')
  }
  if (hasAny(text, ACTION_WORDS)) {
    return failure(
      'missing_parameter',
      'What should I change? Try "use pencil" or "set color to red".',
    )
  }

  return failure(
    'unknown',
    `I did not understand "${text.trim()}". Try "use pencil" or "set color to red".`,
  )
}

/**
 * Deterministic phrase -> commands parser. A phrase may contain several clauses
 * ("draw a circle and fill it red"); each clause is parsed independently and
 * the results are concatenated. If any clause fails, the whole phrase fails so
 * a partial command is never executed. English, plurals, quantities, and simple
 * placements ("three circles on each side") are supported.
 */
export function parseCommand(transcript: string): CommandParseResult {
  const text = normalizeTranscript(transcript)
  if (!text) {
    return failure('unknown', 'I did not catch that. Try saying "use pencil".')
  }

  // Contradictory history intents stay ambiguous even across a compound phrase.
  if (hasAny(text, UNDO_WORDS) && hasAny(text, REDO_WORDS)) {
    return failure('ambiguous', 'Did you mean "undo" or "redo"? Please say one.')
  }

  const commands: PaintCommand[] = []
  for (const clause of splitClauses(text)) {
    const result = parseClause(clause)
    if (!result.ok) return result
    commands.push(...result.commands)
  }

  if (commands.length === 0) {
    return failure(
      'unknown',
      `I did not understand "${transcript.trim()}". Try "use pencil" or "set color to red".`,
    )
  }

  return ok(commands)
}
