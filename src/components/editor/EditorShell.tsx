import { useCallback, useEffect, useState } from 'react'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useProjectPersistence } from '../../hooks/useProjectPersistence'
import { useRecordRecentColor } from '../../hooks/useRecentColors'
import { CanvasStage } from '../canvas/CanvasStage'
import { HistoryPanel } from './HistoryPanel'
import { OptionsBar } from '../toolbar/OptionsBar'
import { Toolbar } from '../toolbar/Toolbar'
import { ToolbarRail } from '../toolbar/ToolbarRail'
import { VoicePanel } from '../voice/VoicePanel'
import { ShortcutsHelp } from './ShortcutsHelp'
import { StatusBar } from './StatusBar'
import { cn } from '../ui/cn'

const DOCK_TABS = [
  { id: 'voice', label: 'Voice' },
  { id: 'history', label: 'History' },
] as const

type DockTab = (typeof DOCK_TABS)[number]['id']

export function EditorShell() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [cropMode, setCropMode] = useState(false)
  const [dockTab, setDockTab] = useState<DockTab>('voice')
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
    /* Studio shell: the chrome fills the viewport (no floating card), so the
     * canvas reads as the workspace rather than a widget on a page. */
    <div className="vop-app-bg relative flex h-screen w-full flex-col overflow-hidden bg-surface-100 text-surface-900">
      <Toolbar onToggleShortcuts={toggleShortcuts} shortcutsOpen={shortcutsOpen} />
      <OptionsBar />

      {/* The canvas is the hero: it takes all remaining height. */}
      <main className="flex min-h-0 flex-1 overflow-hidden">
        <ToolbarRail cropMode={cropMode} onToggleCrop={toggleCrop} />

        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <CanvasStage cropMode={cropMode} onCropComplete={exitCrop} />
        </div>

        <aside className="flex w-72 shrink-0 flex-col overflow-hidden border-l border-surface-200 bg-surface-0">
          <div
            role="tablist"
            aria-label="Panels"
            className="flex shrink-0 items-center gap-0.5 border-b border-surface-200 px-2 py-1.5"
          >
            {DOCK_TABS.map((tab) => {
              const active = dockTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`dock-tab-${tab.id}`}
                  aria-selected={active}
                  aria-controls="dock-panel"
                  onClick={() => setDockTab(tab.id)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-12 font-medium transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-surface-500 hover:bg-surface-100 hover:text-surface-800',
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
          <div
            id="dock-panel"
            role="tabpanel"
            aria-labelledby={`dock-tab-${dockTab}`}
            className="min-h-0 flex-1 overflow-y-auto"
          >
            {dockTab === 'voice' ? <VoicePanel /> : <HistoryPanel />}
          </div>
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
  )
}
