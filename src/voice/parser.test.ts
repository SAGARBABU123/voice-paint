import { describe, expect, it } from 'vitest'
import { parseCommand } from './parser'
import type { CommandParseResult, PaintCommand } from './types'

function commandsOf(result: CommandParseResult): PaintCommand[] {
  if (!result.ok) throw new Error(`expected ok but got failure: ${result.reason}`)
  return result.commands
}

function failureOf(result: CommandParseResult) {
  if (result.ok) throw new Error('expected failure but got ok')
  return { reason: result.reason, message: result.message }
}

describe('parseCommand — tool selection', () => {
  it.each([
    ['use pencil', 'pencil'],
    ['switch to eraser', 'eraser'],
    ['choose ellipse', 'ellipse'],
    ['pen', 'pencil'],
    ['circle', 'ellipse'],
    ['erase', 'eraser'],
  ])('maps "%s" to tool %s', (phrase, tool) => {
    expect(commandsOf(parseCommand(phrase))).toEqual([{ type: 'tool.select', tool }])
  })
})

describe('parseCommand — drawing shapes', () => {
  it.each([
    ['draw a circle', 'ellipse'],
    ['draw a rectangle', 'rectangle'],
    ['add an ellipse', 'ellipse'],
    ['create a line', 'line'],
    ['place a circle', 'ellipse'],
  ])('maps "%s" to drawing %s', (phrase, tool) => {
    expect(commandsOf(parseCommand(phrase))).toEqual([
      { type: 'shape.draw', tool, count: 1, placement: 'center' },
    ])
  })

  it('sets the colour before drawing when one is named', () => {
    expect(commandsOf(parseCommand('draw a red circle'))).toEqual([
      { type: 'color.set', color: '#ef4444' },
      { type: 'shape.draw', tool: 'ellipse', count: 1, placement: 'center' },
    ])
  })
})

describe('parseCommand — fill', () => {
  it('fills with the named colour', () => {
    expect(commandsOf(parseCommand('fill it red'))).toEqual([
      { type: 'color.set', color: '#ef4444' },
      { type: 'canvas.fill' },
    ])
  })

  it('fills with the active colour when none is named', () => {
    expect(commandsOf(parseCommand('fill it'))).toEqual([{ type: 'canvas.fill' }])
  })
})

describe('parseCommand — colour', () => {
  it.each([
    ['set color to red', '#ef4444'],
    ['use blue', '#3b82f6'],
    ['make it green', '#22c55e'],
    ['colour is black', '#000000'],
  ])('maps "%s" to colour %s', (phrase, color) => {
    expect(commandsOf(parseCommand(phrase))).toEqual([{ type: 'color.set', color }])
  })
})

describe('parseCommand — brush size', () => {
  it.each([
    ['set brush size to 8', 8],
    ['brush size 12', 12],
    ['set the brush to 20', 20],
    ['line width 3', 3],
  ])('maps "%s" to size %s', (phrase, size) => {
    expect(commandsOf(parseCommand(phrase))).toEqual([{ type: 'brush.size.set', size }])
  })

  it.each([
    ['make the brush smaller', 'smaller'],
    ['make the brush bigger', 'larger'],
    ['increase brush size', 'larger'],
    ['decrease the size', 'smaller'],
  ])('maps "%s" to a %s adjustment', (phrase, direction) => {
    expect(commandsOf(parseCommand(phrase))).toEqual([{ type: 'brush.size.adjust', direction }])
  })
})

describe('parseCommand — compound', () => {
  it('handles colour + tool in one phrase', () => {
    expect(commandsOf(parseCommand('use the red brush'))).toEqual([
      { type: 'color.set', color: '#ef4444' },
      { type: 'tool.select', tool: 'pencil' },
    ])
  })

  it('draws a circle and fills it with red in one phrase', () => {
    expect(commandsOf(parseCommand('draw a circle and fill it with red color'))).toEqual([
      { type: 'shape.draw', tool: 'ellipse', count: 1, placement: 'center' },
      { type: 'color.set', color: '#ef4444' },
      { type: 'canvas.fill' },
    ])
  })

  it('supports the then and also connectors', () => {
    expect(commandsOf(parseCommand('use blue then draw a rectangle'))).toEqual([
      { type: 'color.set', color: '#3b82f6' },
      { type: 'shape.draw', tool: 'rectangle', count: 1, placement: 'center' },
    ])
    expect(commandsOf(parseCommand('set color to green also fill it'))).toEqual([
      { type: 'color.set', color: '#22c55e' },
      { type: 'canvas.fill' },
    ])
  })

  it('fails the whole phrase when one clause cannot be parsed', () => {
    const result = parseCommand('draw a circle and make me a sandwich')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('missing_parameter')
  })

  it('understands varied phrasings of the same compound', () => {
    const expected = [
      { type: 'shape.draw', tool: 'ellipse', count: 1, placement: 'center' },
      { type: 'color.set', color: '#ef4444' },
      { type: 'canvas.fill' },
    ]
    expect(commandsOf(parseCommand('draw a circle and fill it with red'))).toEqual(expected)
    expect(commandsOf(parseCommand('circle draw and fill red'))).toEqual(expected)
    expect(commandsOf(parseCommand('draw a circle and fill it with the red color'))).toEqual(
      expected,
    )
  })
})

describe('parseCommand — English variants and slang', () => {
  it('understands casual drawing phrases', () => {
    expect(commandsOf(parseCommand('make a circle'))).toEqual([
      { type: 'shape.draw', tool: 'ellipse', count: 1, placement: 'center' },
    ])
    expect(commandsOf(parseCommand('give me a square'))).toEqual([
      { type: 'shape.draw', tool: 'rectangle', count: 1, placement: 'center' },
    ])
    expect(commandsOf(parseCommand('put a box down'))).toEqual([
      { type: 'shape.draw', tool: 'rectangle', count: 1, placement: 'center' },
    ])
  })

  it('understands a longer casual compound', () => {
    expect(commandsOf(parseCommand('draw me a rectangle and fill it blue'))).toEqual([
      { type: 'shape.draw', tool: 'rectangle', count: 1, placement: 'center' },
      { type: 'color.set', color: '#3b82f6' },
      { type: 'canvas.fill' },
    ])
  })

  it('understands plural tool words', () => {
    expect(commandsOf(parseCommand('draw three circles'))).toEqual([
      { type: 'shape.draw', tool: 'ellipse', count: 3, placement: 'row' },
    ])
    expect(commandsOf(parseCommand('add lines'))).toEqual([
      { type: 'shape.draw', tool: 'line', count: 1, placement: 'center' },
    ])
  })

  it('places shapes on each side with quantities', () => {
    expect(commandsOf(parseCommand('add circles on each side three circles'))).toEqual([
      { type: 'shape.draw', tool: 'ellipse', count: 3, placement: 'sides' },
    ])
    expect(commandsOf(parseCommand('put three squares on top'))).toEqual([
      { type: 'shape.draw', tool: 'rectangle', count: 3, placement: 'top' },
    ])
  })

  it('fills inside a drawn shape when asked', () => {
    expect(commandsOf(parseCommand('make one rectangle put that inside with red color'))).toEqual([
      { type: 'color.set', color: '#ef4444' },
      { type: 'shape.draw', tool: 'rectangle', count: 1, placement: 'center' },
      { type: 'canvas.fill' },
    ])
  })

  it('understands save/export slang', () => {
    expect(commandsOf(parseCommand('save my picture'))).toEqual([
      { type: 'canvas.export', format: 'png' },
    ])
  })
})

describe('parseCommand — actions', () => {
  it.each([
    ['undo', 'history.undo'],
    ['undo last action', 'history.undo'],
    ['redo', 'history.redo'],
  ])('maps "%s" to %s', (phrase, type) => {
    expect(commandsOf(parseCommand(phrase))[0]?.type).toBe(type)
  })

  it.each([['clear canvas'], ['clear'], ['wipe the board']])('maps "%s" to a clear', (phrase) => {
    expect(commandsOf(parseCommand(phrase))).toEqual([{ type: 'canvas.clear' }])
  })

  it.each([['export png'], ['save as png'], ['download image']])(
    'maps "%s" to a PNG export',
    (phrase) => {
      expect(commandsOf(parseCommand(phrase))).toEqual([{ type: 'canvas.export', format: 'png' }])
    },
  )

  it.each([['what can I say?'], ['help'], ['show voice commands']])(
    'maps "%s" to help',
    (phrase) => {
      expect(commandsOf(parseCommand(phrase))).toEqual([{ type: 'help.open' }])
    },
  )
})

describe('parseCommand — normalization', () => {
  it('is case- and punctuation-insensitive', () => {
    expect(commandsOf(parseCommand('Use the RED Brush!'))).toEqual(
      commandsOf(parseCommand('use the red brush')),
    )
  })
})

describe('parseCommand — failures', () => {
  it('reports unknown phrases', () => {
    expect(failureOf(parseCommand('pass me the salt')).reason).toBe('unknown')
  })

  it('reports empty input as unknown', () => {
    expect(failureOf(parseCommand('   ')).reason).toBe('unknown')
  })

  it('reports conflicting history intents as ambiguous', () => {
    expect(failureOf(parseCommand('undo redo')).reason).toBe('ambiguous')
  })

  it.each([['set color to'], ['set brush size to'], ['use'], ['switch to'], ['draw a']])(
    'reports "%s" as a missing parameter',
    (phrase) => {
      expect(failureOf(parseCommand(phrase)).reason).toBe('missing_parameter')
    },
  )

  it('never returns a command when it fails', () => {
    const result = parseCommand('make me a sandwich')
    expect(result.ok).toBe(false)
  })
})
