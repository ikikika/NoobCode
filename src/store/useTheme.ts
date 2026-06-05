import { create } from 'zustand'

function readInitialDark(): boolean {
  if (typeof document === 'undefined') return true
  return document.documentElement.classList.contains('dark')
}

function applyTheme(dark: boolean) {
  if (typeof document !== 'undefined') {
    document.documentElement.classList[dark ? 'add' : 'remove']('dark')
  }
  try {
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  } catch {
    // ignore storage failures (private mode, etc.)
  }
}

interface ThemeState {
  isDark: boolean
  toggleTheme: () => void
  setTheme: (dark: boolean) => void
}

export const useTheme = create<ThemeState>((set, get) => ({
  isDark: readInitialDark(),
  toggleTheme: () => {
    const next = !get().isDark
    applyTheme(next)
    set({ isDark: next })
  },
  setTheme: (dark) => {
    applyTheme(dark)
    set({ isDark: dark })
  },
}))
