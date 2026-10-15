import { useRef, useState, type ChangeEvent } from 'react'
import { usePaintEngine, usePaintSnapshot } from '../../hooks/PaintProvider'
import { useRecentColors } from '../../hooks/useRecentColors'
import { COLOR_PALETTE } from '../../paint/constants'
import { readFileAsDataUrl } from '../../paint/image'
import { importImageFile } from '../../paint/importImage'
import { isCvReady } from '../../paint/opencv'
import { SHAPE_ORDER } from '../../paint/shapes'
import { sketchImage } from '../../paint/sketchImage'
import {
  SKETCH_DETAIL_LABELS,
  SKETCH_DETAILS,
  SKETCH_STYLE_LABELS,
  SKETCH_STYLES,
  SKETCH_WEIGHT_LABELS,
  SKETCH_WEIGHTS,
  resolveSketchStyle,
} from '../../paint/sketchStyles'
import { TOOL_ICONS, TOOL_LABELS } from '../toolLabels'
import { Button } from '../ui/Button'
import { Icon, type IconName } from '../ui/Icon'
import { cn } from '../ui/cn'
import { useToast } from '../ui/useToast'
import { DocumentControls } from './DocumentControls'

function GroupLabel({ children }: { children: string }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-surface-400">
      {children}
    </span>
  )
}

function RailDivider() {
  return <span aria-hidden="true" className="h-px w-full bg-surface-200/80" />
}

/** Shapes are icon-only; their name appears on hover. */
function shapeIconClass(active: boolean): string {
  return cn(
    'inline-flex size-9 items-center justify-center rounded-lg transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
    active
      ? 'bg-brand-50 text-brand-700 shadow-soft'
      : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
  )
}

function swatchClass(active: boolean): string {
  return cn(
    'size-6 rounded-full border transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
    active
      ? 'border-transparent ring-2 ring-brand-500 ring-offset-2 ring-offset-surface-0'
      : 'border-surface-300 shadow-sm hover:scale-110',
  )
}

/** Small segmented chip used by the Sketch pencil picker (style/weight/detail). */
function chipClass(active: boolean): string {
  return cn(
    'rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
    active
      ? 'border-brand-300 bg-brand-50 text-brand-700'
      : 'border-surface-200 bg-surface-50 text-surface-600 hover:border-surface-300 hover:text-surface-900',
  )
}

export type ToolbarRailProps = {
  cropMode?: boolean
  onToggleCrop?: () => void
}

/**
 * Vertical tool rail beside the painting sheet. Collapsed to a slim icon
 * strip by default (icons identify each shape); hovering or focusing expands
 * it to the full kit: the shape gallery, colour, recents, and the
 * document/history/export actions pinned at the bottom. Freeform tools and
 * brush size live in the header (Toolbar).
 */
export function ToolbarRail({ cropMode = false, onToggleCrop }: ToolbarRailProps = {}) {
  const engine = usePaintEngine()
  const state = usePaintSnapshot()
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const sketchFileInputRef = useRef<HTMLInputElement | null>(null)
  const isTextTool = state.activeTool === 'text'
  const { colors: recentColors, clear: clearRecentColors } = useRecentColors()
  const [expanded, setExpanded] = useState(true)
  const [exportOpen, setExportOpen] = useState(false)
  const currentSize = isTextTool ? state.fontSize : state.brushSize

  const handleExport = (format: 'png' | 'jpeg' = 'png') => {
    const action = format === 'png' ? engine.exportPng() : engine.exportImage('jpeg')
    void action
      .then(() => {
        toast.show({
          title: 'Export complete',
          description:
            format === 'png'
              ? 'Your drawing was saved as voice-over-paint.png.'
              : 'Your drawing was saved as voice-over-paint.jpg.',
          variant: 'success',
        })
      })
      .catch(() => {
        toast.show({
          title: 'Export failed',
          description: `${format.toUpperCase()} export is not available in this browser.`,
          variant: 'error',
        })
      })
  }

  const handleImageFile = async (file: File) => {
    const ok = await importImageFile(engine, file)
    if (!ok) {
      toast.show({
        title: 'Could not open that image',
        description: 'Please choose a PNG or JPEG file.',
        variant: 'error',
      })
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void handleImageFile(file)
  }

  const handleSketchFile = async (file: File) => {
    try {
      const dataUrl = await readFileAsDataUrl(file)
      // The first conversion lazy-loads the OpenCV WASM engine (~14 MB,
      // browser-cached afterwards) — tell the user it is on its way.
      if (!isCvReady()) {
        toast.show({
          title: 'Preparing the sketch engine',
          description:
            'Loading the computer-vision engine — the first conversion can take a moment.',
          variant: 'info',
        })
      }
      // Sketch follows the current pen (colour, width and style), with the
      // active sketch pencil applied on top (style + weight + detail).
      const snapshot = engine.getSnapshot()
      const { strokes, lineCount } = await sketchImage(
        dataUrl,
        resolveSketchStyle(snapshot.sketchStyle, snapshot.sketchWeight, snapshot.sketchDetail, {
          color: snapshot.color,
          size: Math.max(1, Math.min(3, Math.round(snapshot.brushSize / 2))),
          strokeStyle: snapshot.strokeStyle,
        }),
      )
      if (strokes.length === 0) {
        toast.show({
          title: 'No lines found',
          description: 'Try a photo with stronger contrast.',
          variant: 'error',
        })
        return
      }
      engine.commitOperations(strokes)
      toast.show({
        title: 'Written by hand',
        description: `The app wrote ${lineCount} stroke${lineCount === 1 ? '' : 's'} onto the sheet. Undo to remove.`,
        variant: 'success',
      })
    } catch {
      toast.show({
        title: 'Could not sketch that image',
        description: 'Please choose a PNG or JPEG photo.',
        variant: 'error',
      })
    }
  }

  const handleSketchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void handleSketchFile(file)
  }

  /** Compact icon-only button used by the collapsed strip. */
  const railIcon = (
    label: string,
    icon: IconName,
    onClick: () => void,
    opts: { active?: boolean; disabled?: boolean; size?: number } = {},
  ) => (
    <button
      key={label}
      type="button"
      aria-label={label}
      aria-pressed={opts.active}
      title={label}
      disabled={opts.disabled}
      onClick={onClick}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-lg transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        'disabled:cursor-not-allowed disabled:opacity-40',
        opts.active
          ? 'bg-brand-50 text-brand-700 shadow-soft'
          : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900',
      )}
    >
      <Icon name={icon} size={opts.size ?? 16} />
    </button>
  )

  const expandedContent = (
    <>
      {/* Scrollable creative groups */}
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3">
        {/* Shapes — icon-only, 8 per row; the name appears on hover. */}
        <section className="flex flex-col gap-1.5" aria-label="Shapes">
          <GroupLabel>Shapes</GroupLabel>
          <div className="grid grid-cols-8 gap-1.5" role="group" aria-label="Shapes">
            {SHAPE_ORDER.map((tool) => (
              <button
                key={tool}
                type="button"
                aria-pressed={state.activeTool === tool}
                aria-label={TOOL_LABELS[tool]}
                title={TOOL_LABELS[tool]}
                className={shapeIconClass(state.activeTool === tool)}
                onClick={() => engine.setTool(tool)}
              >
                <Icon name={TOOL_ICONS[tool]} size={17} />
              </button>
            ))}
          </div>
        </section>

        <RailDivider />

        {/* Colour */}
        <section className="flex flex-col gap-1.5" aria-label="Color">
          <GroupLabel>Color</GroupLabel>
          <div className="flex items-center gap-2.5">
            <span
              role="img"
              aria-label={`Current color ${state.color}`}
              title={`Current color: ${state.color}`}
              className="size-6 rounded-full border-2 border-surface-300 shadow-sm"
              style={{ backgroundColor: state.color }}
            />
            <code className="truncate font-mono text-xs text-surface-500" aria-hidden="true">
              {state.color}
            </code>
          </div>
          <div className="grid grid-cols-5 gap-2" role="group" aria-label="Colors">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Select color ${color}`}
                aria-pressed={state.color === color}
                title={color}
                className={swatchClass(state.color === color)}
                style={{ backgroundColor: color }}
                onClick={() => engine.setColor(color)}
              />
            ))}
          </div>
          <label
            title="Pick a custom color"
            className="relative flex h-8 w-10 cursor-pointer items-center justify-center rounded-md border border-surface-200 bg-surface-0 shadow-inset transition-colors duration-150 hover:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-1"
          >
            <span
              aria-hidden="true"
              className="flex size-5 items-center justify-center rounded-full border border-surface-300/70"
              style={{ backgroundColor: state.color }}
            >
              <Icon name="pencil" size={9} className="text-surface-0 mix-blend-difference" />
            </span>
            <input
              type="color"
              aria-label="Custom color"
              value={state.color}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
              onChange={(event) => engine.setColor(event.target.value)}
            />
          </label>
        </section>

        {/* Recent colours */}
        {recentColors.length > 0 ? (
          <>
            <RailDivider />
            <section className="flex flex-col gap-1.5" aria-label="Recent colors">
              <GroupLabel>Recent</GroupLabel>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Recent colors">
                {recentColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Use recent color ${color}`}
                    aria-pressed={state.color === color}
                    title={color}
                    className={swatchClass(state.color === color)}
                    style={{ backgroundColor: color }}
                    onClick={() => engine.setColor(color)}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Clear recent colors"
                onClick={clearRecentColors}
                className="w-fit text-xs font-medium text-surface-500 underline-offset-2 transition-colors duration-150 hover:text-danger-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                Clear
              </button>
            </section>

            {/* Photo-sketch pencil: the pencil, weight and detail used by the
                next Write image… conversion. Applies to voice too. */}
            <section className="flex flex-col gap-1.5" aria-label="Sketch">
              <GroupLabel>Sketch pencil</GroupLabel>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Sketch style">
                {SKETCH_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    aria-pressed={state.sketchStyle === style}
                    title={`${SKETCH_STYLE_LABELS[style]} sketch`}
                    onClick={() => engine.setSketchStyle(style)}
                    className={chipClass(state.sketchStyle === style)}
                  >
                    {SKETCH_STYLE_LABELS[style]}
                  </button>
                ))}
              </div>
              <div
                className="flex flex-wrap items-center gap-1.5"
                role="group"
                aria-label="Sketch weight"
              >
                <span className="min-w-11 text-[11px] text-surface-500">Weight</span>
                {SKETCH_WEIGHTS.map((weight) => (
                  <button
                    key={weight}
                    type="button"
                    aria-pressed={state.sketchWeight === weight}
                    title={`${SKETCH_WEIGHT_LABELS[weight]} sketch strokes`}
                    onClick={() => engine.setSketchWeight(weight)}
                    className={chipClass(state.sketchWeight === weight)}
                  >
                    {SKETCH_WEIGHT_LABELS[weight]}
                  </button>
                ))}
              </div>
              <div
                className="flex flex-wrap items-center gap-1.5"
                role="group"
                aria-label="Sketch detail"
              >
                <span className="min-w-11 text-[11px] text-surface-500">Detail</span>
                {SKETCH_DETAILS.map((detail) => (
                  <button
                    key={detail}
                    type="button"
                    aria-pressed={state.sketchDetail === detail}
                    title={`${SKETCH_DETAIL_LABELS[detail]} photo detail`}
                    onClick={() => engine.setSketchDetail(detail)}
                    className={chipClass(state.sketchDetail === detail)}
                  >
                    {SKETCH_DETAIL_LABELS[detail]}
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>

      {/* Pinned actions: write image, document, history, file */}
      <div className="flex shrink-0 flex-col gap-2 border-t border-surface-100 p-3">
        <Button
          variant="secondary"
          size="xs"
          title="Write your photo as hand-drawn strokes on the sheet"
          leadingIcon={<Icon name="pencil" size={14} />}
          onClick={() => sketchFileInputRef.current?.click()}
        >
          Write image…
        </Button>
        <DocumentControls cropMode={cropMode} onToggleCrop={onToggleCrop ?? (() => {})} />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="History">
          <Button
            variant="secondary"
            size="xs"
            disabled={!state.canUndo}
            aria-keyshortcuts="Control+Z"
            title="Undo (Ctrl/Cmd+Z)"
            leadingIcon={<Icon name="undo" size={14} />}
            onClick={() => engine.undo()}
          >
            Undo
          </Button>
          <Button
            variant="secondary"
            size="xs"
            disabled={!state.canRedo}
            aria-keyshortcuts="Control+Shift+Z"
            title="Redo (Ctrl/Cmd+Shift+Z)"
            leadingIcon={<Icon name="redo" size={14} />}
            onClick={() => engine.redo()}
          >
            Redo
          </Button>
        </div>
        {/* One Export entry; the format menu opens inline on click. */}
        <div className="flex flex-col gap-2" role="group" aria-label="Export">
          <Button
            variant="primary"
            size="xs"
            aria-expanded={exportOpen}
            aria-controls="vop-export-menu"
            title="Open image or export as PNG/JPEG"
            leadingIcon={<Icon name="download" size={14} />}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => setExportOpen((open) => !open)}
          >
            Export
          </Button>
          {exportOpen ? (
            <div
              id="vop-export-menu"
              className="flex flex-col gap-1 rounded-lg border border-surface-200 bg-surface-0 p-1 shadow-soft"
            >
              <button
                type="button"
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-13 font-medium text-surface-700 transition-colors duration-150 hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => {
                  setExportOpen(false)
                  fileInputRef.current?.click()
                }}
              >
                <Icon name="image" size={14} />
                Open image…
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-13 font-medium text-surface-700 transition-colors duration-150 hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => {
                  setExportOpen(false)
                  handleExport('png')
                }}
              >
                <Icon name="download" size={14} />
                PNG
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-13 font-medium text-surface-700 transition-colors duration-150 hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => {
                  setExportOpen(false)
                  handleExport('jpeg')
                }}
              >
                <Icon name="image" size={14} />
                JPEG
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )

  const collapsedStrip = (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto py-3">
      {SHAPE_ORDER.map((tool) =>
        railIcon(TOOL_LABELS[tool], TOOL_ICONS[tool], () => engine.setTool(tool), {
          active: state.activeTool === tool,
          size: 16,
        }),
      )}
      <RailDivider />
      <span
        role="img"
        aria-label={`Current color ${state.color}`}
        title={`Current color: ${state.color}`}
        className="mt-1 size-6 rounded-full border-2 border-surface-300 shadow-sm"
        style={{ backgroundColor: state.color }}
      />
      <span className="text-[10px] font-semibold tabular-nums text-surface-500">
        {currentSize}px
      </span>
      <RailDivider />
      {railIcon('Sketch pencil', 'brush', () => setExpanded(true))}
      {railIcon('Undo', 'undo', () => engine.undo(), { disabled: !state.canUndo })}
      {railIcon('Redo', 'redo', () => engine.redo(), { disabled: !state.canRedo })}
      {railIcon('Export PNG', 'download', () => handleExport('png'), { size: 17 })}
    </div>
  )

  return (
    <div
      role="toolbar"
      aria-label="More tools"
      className={cn(
        'relative flex shrink-0 flex-col overflow-hidden border-r border-surface-200 bg-surface-0 transition-[width] duration-200 ease-out',
        expanded ? 'w-60' : 'w-[52px]',
      )}
    >
      {expanded ? expandedContent : collapsedStrip}

      {/* Pin toggle: docked tool panel instead of hover-magic. */}
      <div className="flex h-8 shrink-0 items-center justify-end border-t border-surface-100 px-2">
        <button
          type="button"
          title={expanded ? 'Collapse tools' : 'Expand tools'}
          aria-label={expanded ? 'Collapse tools' : 'Expand tools'}
          aria-pressed={expanded}
          onClick={() => setExpanded((open) => !open)}
          className="inline-flex size-6 items-center justify-center rounded-md text-surface-400 transition-colors duration-150 hover:bg-surface-100 hover:text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Icon name="panel" size={14} />
        </button>
      </div>

      <input
        ref={fileInputRef}
        id="vop-open-file"
        type="file"
        accept="image/png,image/jpeg"
        aria-label="Choose image file"
        className="hidden"
        onChange={handleFileChange}
      />

      <input
        ref={sketchFileInputRef}
        id="vop-sketch-file"
        type="file"
        accept="image/png,image/jpeg"
        aria-label="Choose photo to sketch"
        className="hidden"
        onChange={handleSketchChange}
      />
    </div>
  )
}
