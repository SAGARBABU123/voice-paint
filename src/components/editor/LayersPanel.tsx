import type { CSSProperties } from 'react'
import { usePaintEngine, usePaintSnapshot } from '../../hooks/PaintProvider'
import { Icon } from '../ui/Icon'
import { cn } from '../ui/cn'

/**
 * Layers panel: the stack (top-most first), with per-layer visibility, opacity,
 * selection and rename, plus reorder / merge / delete / add actions.
 */
export function LayersPanel() {
  const engine = usePaintEngine()
  const snapshot = usePaintSnapshot()
  const layers = snapshot.layers
  const active = layers.find((layer) => layer.id === snapshot.activeLayerId) ?? layers.at(-1)
  // Photoshop-style: the top-most layer is listed first.
  const rows = [...layers].reverse()

  return (
    <section aria-label="Layers" className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-13 font-semibold tracking-tight text-surface-900">
          Layers
        </h2>
        <button
          type="button"
          aria-label="Add layer"
          title="Add layer"
          onClick={() => engine.addLayer()}
          className="inline-flex size-6 items-center justify-center rounded-md text-surface-500 transition-colors duration-150 hover:bg-surface-100 hover:text-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <Icon name="plus" size={15} />
        </button>
      </div>

      {active ? (
        <div className="flex items-center gap-2">
          <label
            htmlFor="vop-layer-opacity"
            className="text-11 font-semibold uppercase tracking-[0.08em] text-surface-400"
          >
            Opacity
          </label>
          <input
            id="vop-layer-opacity"
            type="range"
            min={0}
            max={100}
            value={Math.round(active.opacity * 100)}
            title="Layer opacity"
            className="vault-slider flex-1"
            style={
              { '--vault-slider-fill': `${Math.round(active.opacity * 100)}%` } as CSSProperties
            }
            onChange={(event) =>
              engine.setLayerOpacity(active.id, Number(event.target.value) / 100)
            }
          />
          <span className="w-9 shrink-0 text-right text-12 font-medium tabular-nums text-surface-700">
            {Math.round(active.opacity * 100)}%
          </span>
        </div>
      ) : null}

      <ol className="flex flex-col gap-1" data-testid="layers-list">
        {rows.map((layer) => {
          const current = layer.id === snapshot.activeLayerId
          return (
            <li key={layer.id}>
              <div
                className={cn(
                  'flex items-center gap-1 rounded-md border px-1.5 py-1 transition-colors duration-150',
                  current
                    ? 'border-brand-200/60 bg-brand-50'
                    : 'border-transparent hover:bg-surface-100',
                )}
              >
                <button
                  type="button"
                  aria-label={`${layer.visible ? 'Hide' : 'Show'} ${layer.name}`}
                  aria-pressed={layer.visible}
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                  onClick={() => engine.setLayerVisible(layer.id, !layer.visible)}
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded text-surface-500 transition-colors duration-150 hover:bg-surface-200/60 hover:text-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <Icon name={layer.visible ? 'eye' : 'eye-off'} size={14} />
                </button>
                <button
                  type="button"
                  aria-current={current ? 'true' : undefined}
                  aria-label={`Select ${layer.name}`}
                  onClick={() => engine.selectLayer(layer.id)}
                  className={cn(
                    'flex min-w-0 flex-1 items-center gap-1.5 rounded px-1 py-0.5 text-left text-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    current ? 'font-semibold text-brand-700' : 'text-surface-700',
                  )}
                >
                  <span className="truncate">{layer.name}</span>
                  <span className="shrink-0 text-11 tabular-nums text-surface-400">
                    {layer.operationCount}
                  </span>
                </button>
              </div>
            </li>
          )
        })}
      </ol>

      {active ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="vop-layer-name" className="sr-only">
            Layer name
          </label>
          <input
            id="vop-layer-name"
            value={active.name}
            aria-label="Rename layer"
            onChange={(event) => engine.renameLayer(active.id, event.target.value)}
            className="h-8 rounded-md border border-surface-200 bg-surface-0 px-2 text-12 text-surface-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          />
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Layer actions"
          >
            <LayerAction
              label="Move layer up"
              icon="arrow-up"
              onClick={() => engine.moveLayer(active.id, 1)}
            />
            <LayerAction
              label="Move layer down"
              icon="arrow-down"
              onClick={() => engine.moveLayer(active.id, -1)}
            />
            <button
              type="button"
              onClick={() => engine.mergeDown(active.id)}
              className="rounded-md px-2 py-1 text-12 font-medium text-surface-600 transition-colors duration-150 hover:bg-surface-100 hover:text-surface-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Merge down
            </button>
            <button
              type="button"
              onClick={() => engine.deleteLayer(active.id)}
              disabled={layers.length <= 1}
              className="rounded-md px-2 py-1 text-12 font-medium text-danger-700 transition-colors duration-150 hover:bg-danger-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function LayerAction({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: 'arrow-up' | 'arrow-down'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex size-7 items-center justify-center rounded-md text-surface-500 transition-colors duration-150 hover:bg-surface-100 hover:text-surface-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <Icon name={icon} size={14} />
    </button>
  )
}
