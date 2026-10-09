import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ViewControls } from './ViewControls'

function renderControls(overrides: Partial<Parameters<typeof ViewControls>[0]> = {}) {
  const handlers = {
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onFit: vi.fn(),
    onActualSize: vi.fn(),
  }
  render(<ViewControls zoom={1.25} canZoomIn canZoomOut {...handlers} {...overrides} />)
  return handlers
}

describe('ViewControls', () => {
  it('shows the zoom percentage and wires the buttons', async () => {
    const user = userEvent.setup()
    const handlers = renderControls()

    expect(screen.getByText('125%')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Zoom in' }))
    await user.click(screen.getByRole('button', { name: 'Zoom out' }))
    await user.click(screen.getByRole('button', { name: 'Fit to window' }))
    await user.click(screen.getByRole('button', { name: 'Actual size' }))

    expect(handlers.onZoomIn).toHaveBeenCalledTimes(1)
    expect(handlers.onZoomOut).toHaveBeenCalledTimes(1)
    expect(handlers.onFit).toHaveBeenCalledTimes(1)
    expect(handlers.onActualSize).toHaveBeenCalledTimes(1)
  })

  it('disables zoom buttons at the limits', () => {
    renderControls({ canZoomIn: false, canZoomOut: false })
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled()
  })
})
