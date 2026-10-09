import { useCallback, useState } from 'react'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useProjectPersistence } from '../../hooks/useProjectPersistence'
import { CanvasStage } from '../canvas/CanvasStage'
import { Toolbar } from '../toolbar/Toolbar'
import { VoicePanel } from '../voice/VoicePanel'
import { ShortcutsHelp } from './ShortcutsHelp'
import { StatusBar } from './StatusBar'

export function EditorShell() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const toggleShortcuts = useCallback(() => setShortcutsOpen((open) => !open), [])
  const persistence = useProjectPersistence()

  useKeyboardShortcuts({ onToggleShortcuts: toggleShortcuts })

  return (
    <div className="flex h-screen flex-col bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div>
          <h1 className="text-lg font-semibold">Voice Over Paint</h1>
          <p className="text-sm text-neutral-500">Draw naturally. Stay in control.</p>
        </div>
        <button
          type="button"
          aria-expanded={shortcutsOpen}
          onClick={toggleShortcuts}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700"
        >
          Shortcuts (?)
        </button>
      </header>

      <Toolbar />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        <CanvasStage />
      </main>

      {shortcutsOpen ? (
        <div className="shrink-0 px-4 pt-2">
          <ShortcutsHelp onClose={() => setShortcutsOpen(false)} />
        </div>
      ) : null}

      <VoicePanel />
      <StatusBar persistence={persistence.status} />
    </div>
  )
}
