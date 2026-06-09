import { create } from 'zustand'
import { DEFAULT_THEME, THEME_STORAGE_KEY, isThemeId, type ThemeId } from '../lib/themes'

function readInitialTheme(): ThemeId {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.dataset.theme
    if (isThemeId(attr)) return attr
  }
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemeId(stored)) return stored
  } catch {
    // ignore storage failures (private mode, etc.)
  }
  return DEFAULT_THEME
}

function applyTheme(theme: ThemeId) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = theme
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // ignore storage failures (private mode, etc.)
  }
}

interface ThemeState {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
}

export const useTheme = create<ThemeState>((set) => ({
  theme: readInitialTheme(),
  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
  },
}))
