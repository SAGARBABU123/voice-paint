import type { CSSProperties } from 'react'
import { usePaintEngine, usePaintSnapshot } from '../../hooks/PaintProvider'
import { MAX_BRUSH_SIZE, MAX_FONT_SIZE, MIN_BRUSH_SIZE, MIN_FONT_SIZE } from '../../paint/constants'
import { previewDashArray, strokeStyleLabel } from '../../paint/lineStyle'
import { STROKE_STYLES, type StrokeStyle } from '../../paint/types'
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
    </div>
  )
}
