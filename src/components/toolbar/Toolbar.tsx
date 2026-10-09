const TOOLS = ['Pencil', 'Eraser', 'Line', 'Rectangle', 'Ellipse'] as const

export function Toolbar() {
  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b border-neutral-200 px-4 py-2 dark:border-neutral-800"
      role="toolbar"
      aria-label="Drawing tools"
    >
      {TOOLS.map((tool) => (
        <button
          key={tool}
          type="button"
          disabled
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm disabled:opacity-60 dark:border-neutral-700"
        >
          {tool}
        </button>
      ))}
      <span className="text-xs text-neutral-400">Tools arrive in Milestone 1</span>
    </div>
  )
}
