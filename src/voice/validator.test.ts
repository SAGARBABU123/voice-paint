import { describe, expect, it } from 'vitest'
import type { PaintTool, ShapeTool } from '../paint/types'
import { validateCommands } from './validator'

describe('validateCommands', () => {
  it('accepts valid tool, colour, and size commands', () => {
    const result = validateCommands([
      { type: 'tool.select', tool: 'ellipse' },
      { type: 'color.set', color: '#ff0000' },
      { type: 'brush.size.set', size: 10 },
    ])
    expect(result.ok).toBe(true)
  })

  it('rejects unknown tools', () => {
    const result = validateCommands([
      { type: 'tool.select', tool: 'spray' as unknown as PaintTool },
    ])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('invalid_parameter')
  })

  it('accepts shape draw and canvas fill', () => {
    const result = validateCommands([
      { type: 'shape.draw', tool: 'ellipse' },
      { type: 'canvas.fill' },
    ])
    expect(result.ok).toBe(true)
  })

  it('rejects a draw tool that is not a shape', () => {
    const result = validateCommands([
      { type: 'shape.draw', tool: 'pencil' as unknown as ShapeTool },
    ])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('invalid_parameter')
  })

  it('rejects non-hex colours', () => {
    const result = validateCommands([{ type: 'color.set', color: 'red' }])
    expect(result.ok).toBe(false)
  })

  it('normalizes colour casing', () => {
    const result = validateCommands([{ type: 'color.set', color: '#ABCDEF' }])
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.commands[0]).toEqual({ type: 'color.set', color: '#abcdef' })
  })

  it('clamps out-of-range brush sizes', () => {
    const result = validateCommands([
      { type: 'brush.size.set', size: 999 },
      { type: 'brush.size.set', size: -4 },
      { type: 'brush.size.set', size: 7.6 },
    ])
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.commands).toEqual([
        { type: 'brush.size.set', size: 64 },
        { type: 'brush.size.set', size: 1 },
        { type: 'brush.size.set', size: 8 },
      ])
    }
  })

  it('rejects non-numeric brush sizes', () => {
    const result = validateCommands([{ type: 'brush.size.set', size: Number.NaN }])
    expect(result.ok).toBe(false)
  })

  it('marks clear as requiring confirmation', () => {
    const result = validateCommands([{ type: 'canvas.clear' }])
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.requiresConfirmation).toBe(true)
  })

  it('does not require confirmation for safe commands', () => {
    const result = validateCommands([{ type: 'history.undo' }])
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.requiresConfirmation).toBe(false)
  })

  it('rejects non-PNG exports', () => {
    const result = validateCommands([{ type: 'canvas.export', format: 'jpg' as unknown as 'png' }])
    expect(result.ok).toBe(false)
  })

  it('rejects an empty command list', () => {
    const result = validateCommands([])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('unsupported_command')
  })
})
