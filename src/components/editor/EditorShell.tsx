import { CanvasStage } from '../canvas/CanvasStage'
import { Toolbar } from '../toolbar/Toolbar'
import { VoicePanel } from '../voice/VoicePanel'
import { StatusBar } from './StatusBar'

export function EditorShell() {
  return (
    <div className="flex h-screen flex-col bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <h1 className="text-lg font-semibold">Voice Over Paint</h1>
        <p className="text-sm text-neutral-500">Draw naturally. Stay in control.</p>
      </header>

      <Toolbar />

      <main className="flex flex-1 items-center justify-center overflow-auto p-4">
        <CanvasStage />
      </main>

      <VoicePanel />
      <StatusBar />
    </div>
  )
}
