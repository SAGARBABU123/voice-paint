import type { PaintTool } from '../paint/types'
import { COLOR_NAMES, TOOL_ALIASES } from './grammar'
import type { CommandParseResult, ParseFailureReason, PaintCommand } from './types'

const SIZE_WORDS = ['size', 'width'] as const
const BRUSH_WORDS = ['brush', 'line', 'stroke'] as const

/** Lowercases, strips punctuation (keeping `#`), and collapses whitespace. */
export function normalizeTranscript(transcript: string): string {
  return transcript
    .toLowerCase()
    .replace(/[^a-z0-9#\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasWord(text: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`).test(text)
}

function hasAny(text: string, words: readonly string[]): boolean {
  return words.some((word) => hasWord(text, word))
}

function firstNumber(text: string): number | null {
  const match = text.match(/\d{1,3}/)
  return match ? Number(match[0]) : null
}

function findTool(text: string): PaintTool | null {
  for (const [word, tool] of Object.entries(TOOL_ALIASES)) {
    if (hasWord(text, word)) return tool
  }
  return null
}

function findColor(text: string): string | null {
  for (const [word, hex] of Object.entries(COLOR_NAMES)) {
    if (hasWord(text, word)) return hex
  }
  return null
}

function failure(reason: ParseFailureReason, message: string): CommandParseResult {
  return { ok: false, reason, message }
}

function ok(commands: PaintCommand[]): CommandParseResult {
  return { ok: true, commands }
}

/**
 * Deterministic phrase -> command parser. It only ever returns allowlisted,
 * typed commands or a structured failure; it never executes anything.
 */
export function parseCommand(transcript: string): CommandParseResult {
  const text = normalizeTranscript(transcript)

  if (!text) {
    return failure('unknown', 'I did not catch that. Try saying "use pencil".')
  }

  if (hasWord(text, 'undo') && hasWord(text, 'redo')) {
    return failure('ambiguous', 'Did you mean "undo" or "redo"? Please say one.')
  }

  if (hasAny(text, ['clear', 'wipe'])) {
    return ok([{ type: 'canvas.clear' }])
  }

  if (
    hasAny(text, ['help']) ||
    /what can i say/.test(text) ||
    (hasWord(text, 'show') && hasWord(text, 'commands'))
  ) {
    return ok([{ type: 'help.open' }])
  }

  if (
    hasAny(text, ['export', 'download']) ||
    (hasWord(text, 'save') && hasAny(text, ['png', 'image', 'picture', 'file']))
  ) {
    return ok([{ type: 'canvas.export', format: 'png' }])
  }

  if (hasWord(text, 'undo')) return ok([{ type: 'history.undo' }])
  if (hasWord(text, 'redo')) return ok([{ type: 'history.redo' }])

  if (hasAny(text, ['smaller', 'thinner', 'decrease'])) {
    return ok([{ type: 'brush.size.adjust', direction: 'smaller' }])
  }
  if (hasAny(text, ['bigger', 'larger', 'thicker', 'increase'])) {
    return ok([{ type: 'brush.size.adjust', direction: 'larger' }])
  }

  const tool = findTool(text)
  const color = findColor(text)

  if (hasAny(text, SIZE_WORDS) || (hasAny(text, BRUSH_WORDS) && /\d/.test(text))) {
    const size = firstNumber(text)
    if (size === null) {
      return failure('missing_parameter', 'What brush size? Try "set brush size to 8".')
    }
    return ok([{ type: 'brush.size.set', size }])
  }

  if (tool && color) {
    return ok([
      { type: 'color.set', color },
      { type: 'tool.select', tool },
    ])
  }
  if (tool) return ok([{ type: 'tool.select', tool }])
  if (color) return ok([{ type: 'color.set', color }])

  if (hasAny(text, ['color', 'colour'])) {
    return failure('missing_parameter', 'Which colour? Try "set color to red".')
  }
  if (hasAny(text, SIZE_WORDS)) {
    return failure('missing_parameter', 'What brush size? Try "set brush size to 8".')
  }
  if (hasAny(text, ['use', 'switch', 'select', 'choose', 'draw', 'set', 'change'])) {
    return failure(
      'missing_parameter',
      'What should I change? Try "use pencil" or "set color to red".',
    )
  }

  return failure(
    'unknown',
    `I did not understand "${transcript.trim()}". Try "use pencil" or "set color to red".`,
  )
}
