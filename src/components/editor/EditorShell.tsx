import { useCallback, useEffect, useState } from 'react'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useProjectPersistence } from '../../hooks/useProjectPersistence'
import { useRecordRecentColor } from '../../hooks/useRecentColors'
import { CanvasStage } from '../canvas/CanvasStage'
import { Toolbar } from '../toolbar/Toolbar'
import { ToolbarRail } from '../toolbar/ToolbarRail'
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

  // Esc closes the floating shortcuts panel (standard popover dismissal).
  useEffect(() => {
    if (!shortcutsOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') toggleShortcuts()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcutsOpen, toggleShortcuts])

  return (
    /* Page backdrop: the theme gradient shows around the app card. */
    <div className="vop-app-bg flex h-screen w-full flex-col overflow-hidden bg-surface-50 p-3 sm:p-5">
      {/* One shell: the entire site lives inside a single 4px-radius card. */}
      <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xs border border-surface-200 bg-surface-0 text-surface-900 shadow-soft">
        <Toolbar onToggleShortcuts={toggleShortcuts} shortcutsOpen={shortcutsOpen} />

        {/* The canvas is the hero: it takes all remaining height. */}
        <main className="flex min-h-0 flex-1 gap-3 overflow-hidden p-3 lg:gap-4 lg:p-4">
          <ToolbarRail cropMode={cropMode} onToggleCrop={toggleCrop} />

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <CanvasStage cropMode={cropMode} onCropComplete={exitCrop} />
          </div>

          <aside
            aria-label="Voice transcript"
            className="w-72 shrink-0 overflow-y-auto border-l border-surface-200 bg-surface-0"
          >
            <VoicePanel />
          </aside>
        </main>

        {shortcutsOpen ? (
          <div className="absolute bottom-12 right-4 z-30 w-[26rem]">
            <ShortcutsHelp onClose={toggleShortcuts} />
          </div>
        ) : null}

        {/* Autosave restore in flight — show a subtle skeleton instead of an
          empty canvas so the workspace never looks broken. */}
        {persistence.status === 'loading' ? (
          <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
            <div className="flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-0 px-5 py-4 shadow-raised">
              <span className="vault-skeleton size-8 shrink-0 rounded-lg" />
              <div className="flex flex-col gap-1.5">
                <span className="vault-skeleton h-3.5 w-36 rounded" />
                <span className="vault-skeleton h-3.5 w-24 rounded" />
              </div>
            </div>
            <span className="sr-only">Restoring your drawing…</span>
          </div>
        ) : null}

        <StatusBar persistence={persistence.status} />
      </div>
    </div>
  )
}
