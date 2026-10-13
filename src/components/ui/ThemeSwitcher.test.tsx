import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { initThemeFromStorage } from '../../design/themesStore'
import { ThemeSwitcher } from './ThemeSwitcher'

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
  })

  it('switches to a theme by setting data-theme on <html>', () => {
    render(<ThemeSwitcher />)

    fireEvent.click(screen.getByRole('button', { name: 'Change theme' }))
    fireEvent.click(screen.getByRole('option', { name: /midnight/i }))

    expect(document.documentElement.dataset.theme).toBe('midnight')
    expect(localStorage.getItem('vop-theme')).toBe('midnight')
  })

  it('treats ocean (the locked default) as the no-attribute theme', () => {
    document.documentElement.dataset.theme = 'midnight'
    render(<ThemeSwitcher />)

    fireEvent.click(screen.getByRole('button', { name: 'Change theme' }))
    fireEvent.click(screen.getByRole('option', { name: /ocean/i }))

    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(localStorage.getItem('vop-theme')).toBe('')
  })

  it('switches to the legacy warm-paper combo', () => {
    render(<ThemeSwitcher />)

    fireEvent.click(screen.getByRole('button', { name: 'Change theme' }))
    fireEvent.click(screen.getByRole('option', { name: /warm paper/i }))

    expect(document.documentElement.dataset.theme).toBe('paper')
  })

  it('restores the saved theme on startup', () => {
    localStorage.setItem('vop-theme', 'sunset')

    initThemeFromStorage()

    expect(document.documentElement.dataset.theme).toBe('sunset')
  })

  it('migrates a previously saved ocean id to the default', () => {
    localStorage.setItem('vop-theme', 'ocean')

    initThemeFromStorage()

    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(localStorage.getItem('vop-theme')).toBe('')
  })
})
