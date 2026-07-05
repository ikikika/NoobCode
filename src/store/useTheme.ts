import { create } from 'zustand'
import {
  DEFAULT_DARK_THEME,
  DEFAULT_THEME,
  LAST_DARK_THEME_KEY,
  LAST_LIGHT_THEME_KEY,
  THEME_STORAGE_KEY,
  isPresetDark,
  isThemeId,
  type ThemeId,
} from '../lib/themes'
import { applyCustomColors, clearCustomColors, readCustomTheme, isDarkColor } from '../features/theme/customTheme'

// The active theme is a preset id or 'custom' (a user-built palette stored in
// localStorage and applied as inline CSS vars).
export type ActiveTheme = ThemeId | 'custom'

function isActiveTheme(value: unknown): value is ActiveTheme {
  return value === 'custom' || isThemeId(value)
}

function readStoredThemeId(key: string, dark: boolean): ThemeId {
  try {
    const stored = localStorage.getItem(key)
    if (isThemeId(stored) && isPresetDark(stored) === dark) return stored
  } catch {
    // ignore storage failures (private mode, etc.)
  }
  return dark ? DEFAULT_DARK_THEME : DEFAULT_THEME
}

function rememberScheme(theme: ActiveTheme) {
  if (theme === 'custom') return
  try {
    const key = isPresetDark(theme) ? LAST_DARK_THEME_KEY : LAST_LIGHT_THEME_KEY
    localStorage.setItem(key, theme)
  } catch {
    // ignore storage failures (private mode, etc.)
  }
}

export function isActiveThemeDark(theme: ActiveTheme): boolean {
  if (theme === 'custom') {
    const colors = readCustomTheme()
    return colors ? isDarkColor(colors.surface) : false
  }
  return isPresetDark(theme)
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
  toggleColorScheme: () => void
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: readInitialTheme(),
  setTheme: (theme) => {
    applyTheme(theme)
    rememberScheme(theme)
    set({ theme })
  },
  toggleColorScheme: () => {
    const dark = isActiveThemeDark(get().theme)
    const next = dark ? readStoredThemeId(LAST_LIGHT_THEME_KEY, false) : readStoredThemeId(LAST_DARK_THEME_KEY, true)
    get().setTheme(next)
  },
}))
