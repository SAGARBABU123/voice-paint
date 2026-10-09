import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the product name', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /voice over paint/i })).toBeInTheDocument()
  })

  it('renders the drawing toolbar and canvas workspace', () => {
    render(<App />)
    expect(screen.getByRole('toolbar', { name: /drawing tools/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/drawing canvas/i)).toBeInTheDocument()
  })

  it('exposes manual tools without requiring voice', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Pencil' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eraser' })).toBeInTheDocument()
  })
})
