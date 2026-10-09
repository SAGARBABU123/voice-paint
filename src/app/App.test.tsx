import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the editor shell with the product name', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /voice over paint/i })).toBeInTheDocument()
  })

  it('renders the drawing toolbar and canvas workspace', () => {
    render(<App />)
    expect(screen.getByRole('toolbar', { name: /drawing tools/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/drawing canvas placeholder/i)).toBeInTheDocument()
  })

  it('keeps manual tools available independently of voice', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /pencil/i })).toBeInTheDocument()
  })
})
