import { describe, expect, it } from 'vitest'
import { APP_COMMANDS, filterCommands } from './registry'

describe('command registry', () => {
  it('has unique command ids', () => {
    const ids = APP_COMMANDS.map((command) => command.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('filters by title and keywords', () => {
    expect(filterCommands('zoom').map((c) => c.id)).toContain('view.zoomIn')
    expect(filterCommands('import').map((c) => c.id)).toContain('file.open')
    expect(filterCommands('')).toHaveLength(APP_COMMANDS.length)
    expect(filterCommands('nope-not-a-command')).toHaveLength(0)
  })
})
