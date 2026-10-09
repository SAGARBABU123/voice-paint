import { useCallback, useState } from 'react'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useProjectPersistence } from '../../hooks/useProjectPersistence'
import { useRecordRecentColor } from '../../hooks/useRecentColors'
import { CanvasStage } from '../canvas/CanvasStage'
import { Toolbar } from '../toolbar/Toolbar'
import { VoicePanel } from '../voice/VoicePanel'
import { ShortcutsHelp } from './ShortcutsHelp'
import { StatusBar } from './StatusBar'

export function EditorShell() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [cropMode, setCropMode] = useState(false)
  const toggleShortcuts = useCallback(() => setShortcutsOpen((open) => !open), [])
  const toggleCrop = useCallback(() => setCropMode((enabled) => !enabled), [])
  const exitCrop = useCallback(() => setCropMode(false), [])
  const persistence = useProjectPersistence()

  useKeyboardShortcuts({ onToggleShortcuts: toggleShortcuts })
  useRecordRecentColor()

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

      <Toolbar cropMode={cropMode} onToggleCrop={toggleCrop} />

      <main className="flex min-h-0 flex-1 gap-3 overflow-hidden p-4">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <CanvasStage cropMode={cropMode} onCropComplete={exitCrop} />
        </div>

        <aside
          aria-label="Voice transcript"
          className="w-80 shrink-0 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
        >
          <VoicePanel />
        </aside>
      </main>

      {shortcutsOpen ? (
        <div className="shrink-0 px-4 pt-2">
          <ShortcutsHelp onClose={() => setShortcutsOpen(false)} />
        </div>
      ) : null}

      <StatusBar persistence={persistence.status} />
    </div>
  )
}
