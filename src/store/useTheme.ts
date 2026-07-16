import { create } from 'zustand'
import {
  COLOR_SCHEME_STORAGE_KEY,
  DEFAULT_DARK_THEME,
  DEFAULT_THEME,
  LAST_DARK_THEME_KEY,
  LAST_LIGHT_THEME_KEY,
  THEME_STORAGE_KEY,
  isPresetDark,
  isThemeId,
  type ColorSchemePreference,
  type ThemeId,
} from '../lib/themes'
import { applyCustomColors, clearCustomColors, readCustomTheme, isDarkColor } from '../features/theme/customTheme'

// The active theme is a preset id or 'custom' (a user-built palette stored in
// localStorage and applied as inline CSS vars).
export type ActiveTheme = ThemeId | 'custom'

function isActiveTheme(value: unknown): value is ActiveTheme {
  return value === 'custom' || isThemeId(value)
}

function isColorSchemePreference(value: unknown): value is ColorSchemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
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

function getSystemDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function resolveDark(preference: ColorSchemePreference): boolean {
  if (preference === 'system') return getSystemDark()
  return preference === 'dark'
}

function readColorSchemePreference(): ColorSchemePreference {
  try {
    const stored = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)
    if (isColorSchemePreference(stored)) return stored
  } catch {
    // ignore
  }
  return 'system'
}

function themeForDark(dark: boolean): ActiveTheme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    // Keep custom only when it matches the resolved light/dark side.
    if (stored === 'custom') {
      const colors = readCustomTheme()
      if (colors && isDarkColor(colors.surface) === dark) return 'custom'
    }
  } catch {
    // ignore
  }
  return readStoredThemeId(dark ? LAST_DARK_THEME_KEY : LAST_LIGHT_THEME_KEY, dark)
}

function readInitialTheme(preference: ColorSchemePreference): ActiveTheme {
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.dataset.theme
    if (isActiveTheme(attr)) {
      // Trust the FOUC script when it already resolved for this preference.
      if (preference === 'system' || isActiveThemeDark(attr) === (preference === 'dark')) {
        return attr
      }
    }
  }
  return themeForDark(resolveDark(preference))
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

function persistColorScheme(preference: ColorSchemePreference) {
  try {
    localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, preference)
  } catch {
    // ignore
  }
}

interface ThemeState {
  theme: ActiveTheme
  /** Whether light/dark tracks the OS (`system`) or is locked. */
  colorScheme: ColorSchemePreference
  setTheme: (theme: ActiveTheme) => void
  setColorScheme: (preference: ColorSchemePreference) => void
  /** Cycle system → light → dark → system. */
  cycleColorScheme: () => void
}

const initialColorScheme = readColorSchemePreference()

export const useTheme = create<ThemeState>((set, get) => ({
  theme: readInitialTheme(initialColorScheme),
  colorScheme: initialColorScheme,
  setTheme: (theme) => {
    applyTheme(theme)
    rememberScheme(theme)
    // Picking a concrete palette locks light/dark (exits system follow).
    const preference: ColorSchemePreference = isActiveThemeDark(theme) ? 'dark' : 'light'
    persistColorScheme(preference)
    set({ theme, colorScheme: preference })
  },
  setColorScheme: (preference) => {
    persistColorScheme(preference)
    const theme = themeForDark(resolveDark(preference))
    applyTheme(theme)
    rememberScheme(theme)
    set({ colorScheme: preference, theme })
  },
  cycleColorScheme: () => {
    const order: ColorSchemePreference[] = ['system', 'light', 'dark']
    const i = order.indexOf(get().colorScheme)
    const next = order[(i + 1) % order.length]
    get().setColorScheme(next)
  },
}))

// Keep the active theme in sync when the OS scheme changes and preference is system.
if (typeof window !== 'undefined' && window.matchMedia) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    const { colorScheme, setColorScheme } = useTheme.getState()
    if (colorScheme === 'system') setColorScheme('system')
  }
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', onChange)
  } else {
    // Safari < 14
    mq.addListener(onChange)
  }
}
