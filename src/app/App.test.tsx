import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

async function renderApp() {
  render(<App />)
  // Flush the async project restore so state updates settle inside act().
  await act(async () => {
    await Promise.resolve()
  })
}

/** The vertical rail starts collapsed — hover to reveal the full kit. */
function expandRail() {
  fireEvent.mouseEnter(screen.getByRole('toolbar', { name: /more tools/i }))
}

describe('App', () => {
  it('renders the product name', async () => {
    await renderApp()
    expect(screen.getByRole('heading', { name: /voice over paint/i })).toBeInTheDocument()
  })

  it('renders the drawing toolbar and canvas workspace', async () => {
    await renderApp()
    expect(screen.getByRole('toolbar', { name: /drawing tools/i })).toBeInTheDocument()
    expect(screen.getByRole('toolbar', { name: /more tools/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/drawing canvas/i)).toBeInTheDocument()
  })

  it('exposes manual tools without requiring voice', async () => {
    await renderApp()
    expect(screen.getByRole('button', { name: 'Pencil' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eraser' })).toBeInTheDocument()
  })

  it('shows the drawing hint and the shortcuts control', async () => {
    await renderApp()
    expect(screen.getByText(/draw here with the mouse/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /shortcuts/i })).toBeInTheDocument()
  })

  it('exposes image import and the sheet clear action', async () => {
    await renderApp()
    expandRail()
    fireEvent.click(screen.getByRole('button', { name: 'Export' }))
    expect(screen.getByRole('button', { name: /open image/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear canvas' })).toBeInTheDocument()
  })

  it('exposes document transform controls', async () => {
    await renderApp()
    expandRail()
    expect(screen.getByRole('group', { name: 'Document' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Rotate right' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resize' })).toBeInTheDocument()
  })
})
