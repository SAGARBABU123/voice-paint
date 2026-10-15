import type { PaintEngine } from '../paint/engine'
import type { PaintTool } from '../paint/types'

export type CommandGroup = 'Tools' | 'Edit' | 'View' | 'File' | 'Help'

export type CommandContext = {
  engine: PaintEngine
  zoomIn: () => void
  zoomOut: () => void
  fit: () => void
  actualSize: () => void
  onToggleShortcuts: () => void
}

export type AppCommand = {
  id: string
  title: string
  group: CommandGroup
  /** Extra search terms. */
  keywords?: string
  /** Displayed as a shortcut hint and (for a few) bound globally. */
  shortcut?: string
  run: (context: CommandContext) => void
}

const tool = (id: PaintTool, title: string, shortcut?: string): AppCommand => ({
  id: `tool.${id}`,
  title,
  group: 'Tools',
  keywords: `tool select ${id}`,
  shortcut,
  run: ({ engine }) => engine.setTool(id),
})

/** The single source of truth for the menu bar and the ⌘K palette. */
export const APP_COMMANDS: readonly AppCommand[] = [
  tool('pencil', 'Pencil', 'P'),
  tool('eraser', 'Eraser', 'E'),
  tool('line', 'Line', 'L'),
  tool('rectangle', 'Rectangle', 'R'),
  tool('ellipse', 'Ellipse', 'O'),
  tool('text', 'Text', 'T'),
  tool('fill', 'Fill', 'F'),
  tool('select', 'Select / move', 'M'),
  tool('eyedropper', 'Eyedropper', 'I'),

  {
    id: 'history.undo',
    title: 'Undo',
    group: 'Edit',
    shortcut: 'Ctrl+Z',
    run: ({ engine }) => engine.undo(),
  },
  {
    id: 'history.redo',
    title: 'Redo',
    group: 'Edit',
    shortcut: 'Ctrl+Shift+Z',
    run: ({ engine }) => engine.redo(),
  },

  {
    id: 'view.zoomIn',
    title: 'Zoom in',
    group: 'View',
    shortcut: 'Ctrl++',
    run: ({ zoomIn }) => zoomIn(),
  },
  {
    id: 'view.zoomOut',
    title: 'Zoom out',
    group: 'View',
    shortcut: 'Ctrl+-',
    run: ({ zoomOut }) => zoomOut(),
  },
  {
    id: 'view.fit',
    title: 'Zoom to fit',
    group: 'View',
    shortcut: 'Ctrl+0',
    run: ({ fit }) => fit(),
  },
  {
    id: 'view.actual',
    title: 'Actual size (100%)',
    group: 'View',
    shortcut: 'Ctrl+1',
    run: ({ actualSize }) => actualSize(),
  },

  {
    id: 'file.open',
    title: 'Open image…',
    group: 'File',
    keywords: 'import png jpeg',
    run: () => document.getElementById('vop-open-file')?.click(),
  },
  {
    id: 'file.sketch',
    title: 'Write image as sketch…',
    group: 'File',
    keywords: 'trace photo pencil',
    run: () => document.getElementById('vop-sketch-file')?.click(),
  },
  {
    id: 'file.exportPng',
    title: 'Export PNG',
    group: 'File',
    shortcut: 'Ctrl+S',
    run: ({ engine }) => void engine.exportPng(),
  },
  {
    id: 'file.exportJpeg',
    title: 'Export JPEG',
    group: 'File',
    run: ({ engine }) => void engine.exportImage('jpeg'),
  },

  {
    id: 'help.shortcuts',
    title: 'Keyboard shortcuts',
    group: 'Help',
    keywords: 'keys help',
    run: ({ onToggleShortcuts }) => onToggleShortcuts(),
  },
]

export const COMMAND_GROUPS: readonly CommandGroup[] = ['Tools', 'Edit', 'View', 'File', 'Help']

/** Case-insensitive fuzzy-ish filter on title + keywords. */
export function filterCommands(query: string): readonly AppCommand[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return APP_COMMANDS
  return APP_COMMANDS.filter((command) =>
    `${command.title} ${command.group} ${command.keywords ?? ''}`.toLowerCase().includes(needle),
  )
}
