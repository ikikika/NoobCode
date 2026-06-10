import { create } from 'zustand'
import { DEFAULT_THEME, THEME_STORAGE_KEY, isThemeId, type ThemeId } from '../lib/themes'
import { applyCustomColors, clearCustomColors, readCustomTheme } from '../features/theme/customTheme'

// The active theme is a preset id or 'custom' (a user-built palette stored in
// localStorage and applied as inline CSS vars).
export type ActiveTheme = ThemeId | 'custom'

function isActiveTheme(value: unknown): value is ActiveTheme {
  return value === 'custom' || isThemeId(value)
}

function readInitialTheme(): ActiveTheme {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.dataset.theme
    if (isActiveTheme(attr)) return attr
  }
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isActiveTheme(stored)) return stored
  } catch {
    // ignore storage failures (private mode, etc.)
  }
  return DEFAULT_THEME
}

function applyTheme(theme: ActiveTheme) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme
    // Custom themes override presets via inline vars; presets clear them.
    if (theme === 'custom') {
      const colors = readCustomTheme()
      if (colors) applyCustomColors(colors)
    } else {
      clearCustomColors()
    }
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // ignore storage failures (private mode, etc.)
  }
}

interface ThemeState {
  theme: ActiveTheme
  setTheme: (theme: ActiveTheme) => void
}

export const useTheme = create<ThemeState>((set) => ({
  theme: readInitialTheme(),
  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
  },
}))
