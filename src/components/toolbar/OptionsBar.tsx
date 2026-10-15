import type { CSSProperties } from 'react'
import { usePaintEngine, usePaintSnapshot } from '../../hooks/PaintProvider'
import { MAX_BRUSH_SIZE, MAX_FONT_SIZE, MIN_BRUSH_SIZE, MIN_FONT_SIZE } from '../../paint/constants'
import { previewDashArray, strokeStyleLabel } from '../../paint/lineStyle'
import { STROKE_STYLES, type StrokeStyle } from '../../paint/types'
import type { Symmetry } from '../../paint/symmetry'
import { TOOL_ICONS, TOOL_LABELS } from '../toolLabels'
import { Icon } from '../ui/Icon'
import { cn } from '../ui/cn'

/** Tools that paint with a line, i.e. where the stroke style applies. */
const STROKE_TOOLS = new Set([
  'pencil',
  'eraser',
  'line',
  'curve',
  'rectangle',
  'rounded-rectangle',
  'ellipse',
  'polygon',
  'triangle',
  'right-triangle',
  'diamond',
  'pentagon',
  'hexagon',
  'arrow-up',
  'arrow-right',
  'arrow-down',
  'arrow-left',
  'star-4',
  'star-5',
  'star-6',
  'chat',
  'callout-round',
  'callout-cloud',
  'heart',
  'lightning',
])

const SYMMETRY_OPTIONS: readonly { value: Symmetry; text: string; label: string }[] = [
  { value: 'off', text: 'Off', label: 'No symmetry' },
  { value: 'x', text: 'X', label: 'Mirror horizontally' },
  { value: 'y', text: 'Y', label: 'Mirror vertically' },
  { value: 'both', text: 'Both', label: 'Mirror both axes' },
]

function StrokePreview({ style }: { style: StrokeStyle }) {
  return (
    <svg width="26" height="10" viewBox="0 0 26 10" aria-hidden="true" className="shrink-0">
      <line
        x1="2"
        y1="5"
        x2="24"
        y2="5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={previewDashArray(style)}
      />
    </svg>
  )
}

/**
 * Contextual options bar (the row under the app bar). Shows the active tool and
 * its options — size and stroke style — the way a desktop paint app does, so
 * the app bar can stay about the document and the workspace stays uncluttered.
 */
export function OptionsBar() {
  const engine = usePaintEngine()
  const state = usePaintSnapshot()
  const isTextTool = state.activeTool === 'text'
  const minSize = isTextTool ? MIN_FONT_SIZE : MIN_BRUSH_SIZE
  const maxSize = isTextTool ? MAX_FONT_SIZE : MAX_BRUSH_SIZE
  const currentSize = isTextTool ? state.fontSize : state.brushSize
  const sizeLabel = isTextTool ? 'Font size' : 'Brush size'
  const fillPercent = ((currentSize - minSize) / (maxSize - minSize)) * 100
  const showStroke = STROKE_TOOLS.has(state.activeTool)
  const isFreehand = state.activeTool === 'pencil' || state.activeTool === 'eraser'
  const showFill =
    showStroke &&
    state.activeTool !== 'line' &&
    state.activeTool !== 'curve' &&
    state.activeTool !== 'pencil' &&
    state.activeTool !== 'eraser'

  return (
    <div className="flex h-11 shrink-0 items-center gap-3 overflow-x-auto border-b border-surface-200 bg-surface-0 px-3">
      <div className="flex shrink-0 items-center gap-2">
        <span className="inline-flex size-6 items-center justify-center rounded-md bg-surface-100 text-surface-600">
          <Icon name={TOOL_ICONS[state.activeTool]} size={15} />
        </span>
        <span className="whitespace-nowrap text-13 font-medium text-surface-800">
          {TOOL_LABELS[state.activeTool]}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2 border-l border-surface-200 pl-3">
        <label
          htmlFor="vop-options-size"
          className="text-11 font-semibold uppercase tracking-[0.08em] text-surface-400"
        >
          {sizeLabel}
        </label>
        <input
          id="vop-options-size"
          type="range"
          min={minSize}
          max={maxSize}
          value={currentSize}
          title={`${sizeLabel} ( - / + )`}
          className="vault-slider w-28 lg:w-40"
          style={{ '--vault-slider-fill': `${fillPercent}%` } as CSSProperties}
          onChange={(event) => {
            const value = Number(event.target.value)
            if (isTextTool) engine.setFontSize(value)
            else engine.setBrushSize(value)
          }}
        />
        <span className="w-10 shrink-0 text-right text-13 font-medium tabular-nums text-surface-700">
          {currentSize}px
        </span>
      </div>

      {isTextTool ? (
        <div className="flex shrink-0 items-center gap-2 border-l border-surface-200 pl-3">
          <label
            htmlFor="vop-options-font"
            className="text-11 font-semibold uppercase tracking-[0.08em] text-surface-400"
          >
            Typeface
          </label>
          <select
            id="vop-options-font"
            value={state.fontFamily}
            title="Font family"
            onChange={(event) => engine.setFontFamily(event.target.value)}
            className="h-7 rounded-md border border-surface-200 bg-surface-0 px-2 text-13 text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <option value="sans-serif">Sans</option>
            <option value="serif">Serif</option>
            <option value="monospace">Mono</option>
          </select>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              aria-pressed={state.fontBold}
              aria-label="Bold"
              title="Bold"
              onClick={() => engine.setFontBold(!state.fontBold)}
              className={cn(
                'inline-flex size-7 items-center justify-center rounded-md text-13 font-bold transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                state.fontBold
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-surface-500 hover:bg-surface-100 hover:text-surface-800',
              )}
            >
              B
            </button>
            <button
              type="button"
              aria-pressed={state.fontItalic}
              aria-label="Italic"
              title="Italic"
              onClick={() => engine.setFontItalic(!state.fontItalic)}
              className={cn(
                'inline-flex size-7 items-center justify-center rounded-md text-13 italic transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                state.fontItalic
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-surface-500 hover:bg-surface-100 hover:text-surface-800',
              )}
            >
              I
            </button>
          </div>
        </div>
      ) : null}

      {state.activeTool === 'fill' ? (
        <div className="flex shrink-0 items-center gap-2 border-l border-surface-200 pl-3">
          <label
            htmlFor="vop-options-tolerance"
            className="text-11 font-semibold uppercase tracking-[0.08em] text-surface-400"
          >
            Tolerance
          </label>
          <input
            id="vop-options-tolerance"
            type="range"
            min={0}
            max={128}
            value={state.fillTolerance}
            title="Fill tolerance — higher fills across similar colours"
            className="vault-slider w-24 lg:w-32"
            style={
              { '--vault-slider-fill': `${(state.fillTolerance / 128) * 100}%` } as CSSProperties
            }
            onChange={(event) => engine.setFillTolerance(Number(event.target.value))}
          />
          <span
            data-testid="fill-tolerance-value"
            className="w-8 shrink-0 text-right text-13 font-medium tabular-nums text-surface-700"
          >
            {state.fillTolerance}
          </span>
        </div>
      ) : null}

      {showFill ? (
        <div
          className="flex shrink-0 items-center gap-2 border-l border-surface-200 pl-3"
          role="group"
          aria-label="Shape fill"
        >
          <span className="text-11 font-semibold uppercase tracking-[0.08em] text-surface-400">
            Fill
          </span>
          <div className="flex items-center gap-0.5">
            {([false, true] as const).map((value) => {
              const active = state.shapeFill === value
              return (
                <button
                  key={String(value)}
                  type="button"
                  aria-pressed={active}
                  aria-label={value ? 'Filled shape' : 'Outlined shape'}
                  title={value ? 'Draw filled shapes' : 'Draw shape outlines'}
                  onClick={() => engine.setShapeFill(value)}
                  className={cn(
                    'inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-12 font-medium transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-surface-500 hover:bg-surface-100 hover:text-surface-800',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="inline-block size-3.5 rounded-[3px] border border-current"
                    style={{ backgroundColor: value ? state.color : 'transparent' }}
                  />
                  {value ? 'Fill' : 'Outline'}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {showStroke ? (
        <div
          className="flex shrink-0 items-center gap-2 border-l border-surface-200 pl-3"
          role="group"
          aria-label="Stroke style"
        >
          <span className="text-11 font-semibold uppercase tracking-[0.08em] text-surface-400">
            Stroke
          </span>
          <div className="flex items-center gap-0.5">
            {STROKE_STYLES.map((style) => {
              const active = state.strokeStyle === style
              return (
                <button
                  key={style}
                  type="button"
                  aria-pressed={active}
                  aria-label={strokeStyleLabel(style)}
                  title={strokeStyleLabel(style)}
                  onClick={() => engine.setStrokeStyle(style)}
                  className={cn(
                    'inline-flex h-7 items-center justify-center rounded-md px-1.5 transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-surface-500 hover:bg-surface-100 hover:text-surface-800',
                  )}
                >
                  <StrokePreview style={style} />
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {showStroke ? (
        <div className="flex shrink-0 items-center gap-2 border-l border-surface-200 pl-3">
          <label
            htmlFor="vop-options-opacity"
            className="text-11 font-semibold uppercase tracking-[0.08em] text-surface-400"
          >
            Opacity
          </label>
          <input
            id="vop-options-opacity"
            type="range"
            min={5}
            max={100}
            value={Math.round(state.brushOpacity * 100)}
            title="Brush opacity"
            className="vault-slider w-24 lg:w-28"
            style={
              { '--vault-slider-fill': `${Math.round(state.brushOpacity * 100)}%` } as CSSProperties
            }
            onChange={(event) => engine.setBrushOpacity(Number(event.target.value) / 100)}
          />
          <span
            data-testid="brush-opacity-value"
            className="w-9 shrink-0 text-right text-13 font-medium tabular-nums text-surface-700"
          >
            {Math.round(state.brushOpacity * 100)}%
          </span>
        </div>
      ) : null}

      {isFreehand ? (
        <div className="flex shrink-0 items-center gap-2 border-l border-surface-200 pl-3">
          <label
            htmlFor="vop-options-smoothing"
            className="text-11 font-semibold uppercase tracking-[0.08em] text-surface-400"
          >
            Smooth
          </label>
          <input
            id="vop-options-smoothing"
            type="range"
            min={0}
            max={90}
            value={Math.round(state.brushSmoothing * 100)}
            title="Stroke smoothing"
            className="vault-slider w-20 lg:w-24"
            style={
              {
                '--vault-slider-fill': `${Math.round(state.brushSmoothing * 100)}%`,
              } as CSSProperties
            }
            onChange={(event) => engine.setBrushSmoothing(Number(event.target.value) / 100)}
          />
          <button
            type="button"
            aria-pressed={state.brushPressure}
            aria-label="Pen pressure"
            title="Vary stroke width with pen pressure"
            onClick={() => engine.setBrushPressure(!state.brushPressure)}
            className={cn(
              'rounded-md px-2 py-1 text-12 font-medium transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              state.brushPressure
                ? 'bg-brand-50 text-brand-700'
                : 'text-surface-500 hover:bg-surface-100 hover:text-surface-800',
            )}
          >
            Pressure
          </button>
        </div>
      ) : null}
      {showStroke ? (
        <div
          className="flex shrink-0 items-center gap-2 border-l border-surface-200 pl-3"
          role="group"
          aria-label="Symmetry"
        >
          <span className="text-11 font-semibold uppercase tracking-[0.08em] text-surface-400">
            Symmetry
          </span>
          <div className="flex items-center gap-0.5">
            {SYMMETRY_OPTIONS.map((option) => {
              const active = state.symmetry === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  aria-label={option.label}
                  title={option.label}
                  onClick={() => engine.setSymmetry(option.value)}
                  className={cn(
                    'inline-flex h-7 items-center rounded-md px-2 text-12 font-medium transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-surface-500 hover:bg-surface-100 hover:text-surface-800',
                  )}
                >
                  {option.text}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
