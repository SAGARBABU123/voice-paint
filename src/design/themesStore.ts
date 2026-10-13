/**
 * Theme registry + storage. Pure module logic (no React) so it can be used
 * from main.tsx and the ThemeSwitcher component. The '' id means "no
 * data-theme" → the locked base theme (Ocean); every other id maps to a
 * `[data-theme]` block in themes.css.
 */

export const VOP_THEME_KEY = 'vop-theme'

export const THEME_OPTIONS: readonly { id: string; name: string; swatch: string }[] = [
  {
    id: '',
    name: 'Ocean',
    swatch: 'linear-gradient(135deg, #1c5fde 0%, #2184c8 45%, #1d8f92 100%)',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    swatch: 'linear-gradient(135deg, #3240c9 0%, #4e3fd0 55%, #0f86b8 100%)',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    swatch: 'linear-gradient(135deg, #ab2444 0%, #e04460 42%, #f7a13d 100%)',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    swatch: 'linear-gradient(135deg, #0e7f74 0%, #13835f 48%, #5ea63c 100%)',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    swatch: 'linear-gradient(135deg, #4a39b3 0%, #6d5ce6 45%, #c75cb3 100%)',
  },
  {
    id: 'paper',
    name: 'Warm paper',
    swatch: 'linear-gradient(135deg, #5b66e8, #6f7bf2 55%, #8b96f7)',
  },
]

export function currentTheme(): string {
  return document.documentElement.dataset.theme ?? ''
}

/** Applies a theme id to <html>, or removes the attribute for the default. */
export function applyTheme(id: string): void {
  if (id === '') delete document.documentElement.dataset.theme
  else document.documentElement.dataset.theme = id
  try {
    localStorage.setItem(VOP_THEME_KEY, id)
  } catch {
    // Theme is a convenience; storage failure is harmless.
  }
}

/** Restores the saved theme before the first render (called from main.tsx). */
export function initThemeFromStorage(): void {
  try {
    const saved = localStorage.getItem(VOP_THEME_KEY)
    if (saved === null) return
    // 'ocean' was previously a data-theme id; it is now the default (no id).
    const id = saved === 'ocean' ? '' : saved
    if (!THEME_OPTIONS.some((theme) => theme.id === id)) return
    if (id !== currentTheme()) {
      applyTheme(id)
    } else if (saved === 'ocean') {
      // Already the default; just normalise the stored value.
      localStorage.setItem(VOP_THEME_KEY, '')
    }
  } catch {
    // Ignore storage errors; the html attribute stays as authored.
  }
}
