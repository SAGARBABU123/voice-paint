import { useRef, type ButtonHTMLAttributes, type ChangeEvent } from 'react'
import { usePaintEngine, usePaintSnapshot } from '../../hooks/PaintProvider'
import { COLOR_PALETTE, MAX_BRUSH_SIZE, MIN_BRUSH_SIZE } from '../../paint/constants'
import { createImageOperation, readFileAsDataUrl } from '../../paint/image'
import { loadImage } from '../../paint/imageCache'
import { PAINT_TOOLS, type PaintTool } from '../../paint/types'
import { TOOL_LABELS } from '../toolLabels'
import { DocumentControls } from './DocumentControls'

const TOOL_SHORTCUTS: Record<PaintTool, string> = {
  pencil: 'P',
  eraser: 'E',
  line: 'L',
  rectangle: 'R',
  ellipse: 'O',
}

function buttonClass(active: boolean): string {
  return [
    'rounded-md border px-3 py-1.5 text-sm transition-colors',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
    'disabled:cursor-not-allowed disabled:opacity-50',
    active
      ? 'border-blue-500 bg-blue-500 text-white'
      : 'border-neutral-300 bg-white hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800',
  ].join(' ')
}

function ActionButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={buttonClass(false)} />
}

export type ToolbarProps = {
  cropMode?: boolean
  onToggleCrop?: () => void
}

export function Toolbar({ cropMode = false, onToggleCrop }: ToolbarProps = {}) {
  const engine = usePaintEngine()
  const state = usePaintSnapshot()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleClear = () => {
    if (state.operationCount === 0) return
    const confirmed = window.confirm('Clear the canvas? This removes the current drawing.')
    if (confirmed) engine.clear()
  }

  const handleExport = () => {
    void engine.exportPng().catch(() => {
      window.alert('Export is not available in this browser.')
    })
  }

  const handleImageFile = async (file: File) => {
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const image = await loadImage(dataUrl)
      const operation = createImageOperation(
        dataUrl,
        image.naturalWidth || image.width,
        image.naturalHeight || image.height,
        engine.width,
        engine.height,
      )
      engine.commit(operation)
    } catch {
      window.alert('Could not open that image. Please choose a PNG or JPEG file.')
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void handleImageFile(file)
  }

  return (
    <div className="flex flex-col gap-2 border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
      <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Drawing tools">
        {PAINT_TOOLS.map((tool) => (
          <button
            key={tool}
            type="button"
            aria-pressed={state.activeTool === tool}
            aria-keyshortcuts={TOOL_SHORTCUTS[tool]}
            title={`${TOOL_LABELS[tool]} (${TOOL_SHORTCUTS[tool]})`}
            className={buttonClass(state.activeTool === tool)}
            onClick={() => engine.setTool(tool)}
          >
            {TOOL_LABELS[tool]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Colors">
        <span className="text-xs font-medium text-neutral-500">Color</span>
        {COLOR_PALETTE.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Select color ${color}`}
            aria-pressed={state.color === color}
            title={color}
            className="size-6 rounded-full border border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 aria-pressed:ring-2 aria-pressed:ring-blue-500 aria-pressed:ring-offset-1"
            style={{ backgroundColor: color }}
            onClick={() => engine.setColor(color)}
          />
        ))}
        <input
          type="color"
          aria-label="Custom color"
          value={state.color}
          className="size-8 cursor-pointer rounded border border-neutral-300 bg-transparent"
          onChange={(event) => engine.setColor(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Brush settings">
        <label htmlFor="brush-size" className="text-xs font-medium text-neutral-500">
          Brush size
        </label>
        <input
          id="brush-size"
          type="range"
          min={MIN_BRUSH_SIZE}
          max={MAX_BRUSH_SIZE}
          value={state.brushSize}
          title="Brush size ( - / + )"
          className="w-40"
          onChange={(event) => engine.setBrushSize(Number(event.target.value))}
        />
        <span className="w-12 text-sm tabular-nums text-neutral-600 dark:text-neutral-400">
          {state.brushSize}px
        </span>
      </div>

      <DocumentControls cropMode={cropMode} onToggleCrop={onToggleCrop ?? (() => {})} />

      <div
        className="flex flex-wrap items-center gap-2"
        role="group"
        aria-label="History and export"
      >
        <ActionButton
          disabled={!state.canUndo}
          aria-keyshortcuts="Control+Z"
          title="Undo (Ctrl/Cmd+Z)"
          onClick={() => engine.undo()}
        >
          Undo
        </ActionButton>
        <ActionButton
          disabled={!state.canRedo}
          aria-keyshortcuts="Control+Shift+Z"
          title="Redo (Ctrl/Cmd+Shift+Z)"
          onClick={() => engine.redo()}
        >
          Redo
        </ActionButton>
        <ActionButton
          disabled={state.operationCount === 0}
          title="Clear canvas"
          onClick={handleClear}
        >
          Clear
        </ActionButton>
        <ActionButton
          title="Open a PNG or JPEG image"
          onClick={() => fileInputRef.current?.click()}
        >
          Open image
        </ActionButton>
        <ActionButton
          aria-keyshortcuts="Control+S"
          title="Export PNG (Ctrl/Cmd+S)"
          onClick={handleExport}
        >
          Export PNG
        </ActionButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          aria-label="Choose image file"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
