import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PaintEngineProvider } from '../../hooks/PaintProvider'
import { PaintEngine } from '../../paint/engine'
import { DocumentControls } from './DocumentControls'

function renderControls(overrides: Partial<Parameters<typeof DocumentControls>[0]> = {}) {
  const engine = new PaintEngine()
  const onToggleCrop = vi.fn()
  render(
    <PaintEngineProvider engine={engine}>
      <DocumentControls cropMode={false} onToggleCrop={onToggleCrop} {...overrides} />
    </PaintEngineProvider>,
  )
  return { engine, onToggleCrop }
}

describe('DocumentControls', () => {
  it('rotates the document right and left', async () => {
    const user = userEvent.setup()
    const { engine } = renderControls()

    await user.click(screen.getByRole('button', { name: 'Rotate right' }))
    expect(engine.width).toBe(720)
    expect(engine.height).toBe(960)

    await user.click(screen.getByRole('button', { name: 'Rotate left' }))
    expect(engine.width).toBe(960)
    expect(engine.height).toBe(720)
  })

  it('toggles crop mode', async () => {
    const user = userEvent.setup()
    const { onToggleCrop } = renderControls()

    await user.click(screen.getByRole('button', { name: 'Crop' }))
    expect(onToggleCrop).toHaveBeenCalledTimes(1)
  })

  it('resizes via the dialog and closes it', async () => {
    const user = userEvent.setup()
    const { engine } = renderControls()

    await user.click(screen.getByRole('button', { name: 'Resize' }))
    const width = screen.getByLabelText('Width')
    await user.clear(width)
    await user.type(width, '480')
    await user.click(screen.getByRole('button', { name: 'Apply resize' }))

    expect(engine.width).toBe(480)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
