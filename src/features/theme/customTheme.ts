// Custom theme support: a user-defined map of --color-* tokens, persisted to
// localStorage and applied as inline styles on <html> when the 'custom' theme is
// active (so it overrides the preset [data-theme] blocks). Seeded from whatever
// theme is currently applied via getComputedStyle — no token tables to duplicate.

export const CUSTOM_THEME_STORAGE_KEY = 'noobcode-custom-theme'

export interface TokenGroup {
  title: string
  tokens: { key: string; label: string }[]
}

// Editable tokens, grouped for the picker UI. `--color-accent-soft` is derived
// from `accent` automatically, so it is not edited directly.
export const TOKEN_GROUPS: TokenGroup[] = [
  {
    title: 'Surfaces',
    tokens: [
      { key: 'surface', label: 'Background' },
      { key: 'surface-raised', label: 'Raised' },
      { key: 'surface-sunken', label: 'Sunken' },
    ],
  },
  {
    title: 'Text',
    tokens: [
      { key: 'fg', label: 'Primary' },
      { key: 'fg-muted', label: 'Muted' },
      { key: 'fg-subtle', label: 'Subtle' },
    ],
  },
  {
    title: 'Lines',
    tokens: [
      { key: 'line', label: 'Border' },
      { key: 'line-soft', label: 'Border soft' },
    ],
  },
  {
    title: 'Accent',
    tokens: [
      { key: 'accent', label: 'Accent' },
      { key: 'accent-hover', label: 'Accent hover' },
      { key: 'accent-contrast', label: 'Accent text' },
    ],
  },
  {
    title: 'Status',
    tokens: [
      { key: 'pass', label: 'Pass' },
      { key: 'pass-surface', label: 'Pass surface' },
      { key: 'fail', label: 'Fail' },
      { key: 'fail-surface', label: 'Fail surface' },
    ],
  },
  {
    title: 'Difficulty',
    tokens: [
      { key: 'easy', label: 'Easy' },
      { key: 'easy-surface', label: 'Easy surface' },
      { key: 'medium', label: 'Medium' },
      { key: 'medium-surface', label: 'Medium surface' },
      { key: 'hard', label: 'Hard' },
      { key: 'hard-surface', label: 'Hard surface' },
    ],
  },
  {
    title: 'Diff',
    tokens: [
      { key: 'diff-added', label: 'Added' },
      { key: 'diff-added-surface', label: 'Added surface' },
      { key: 'diff-removed', label: 'Removed' },
      { key: 'diff-removed-surface', label: 'Removed surface' },
    ],
  },
]

export const TOKEN_KEYS: string[] = TOKEN_GROUPS.flatMap((g) => g.tokens.map((t) => t.key))

export type CustomColors = Record<string, string>

const HEX6 = /^#[0-9a-fA-F]{6}$/

export function normalizeHex(value: string): string {
  const v = value.trim()
  if (HEX6.test(v)) return v.toLowerCase()
  // Expand #abc → #aabbcc
  const short = /^#([0-9a-fA-F]{3})$/.exec(v)
  if (short) {
    const [r, g, b] = short[1].split('')
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return '#000000'
}

function hexToRgb(hex: string): [number, number, number] {
  const h = normalizeHex(hex).slice(1)
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** Perceived luminance (0–255). Used to pick a vs / vs-dark Monaco base. */
export function isDarkColor(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex)
  return 0.299 * r + 0.587 * g + 0.114 * b < 128
}

/** Read the currently-applied theme's tokens as editable hex defaults. */
export function readActiveColors(): CustomColors {
  const colors: CustomColors = {}
  if (typeof document === 'undefined') return colors
  const style = getComputedStyle(document.documentElement)
  for (const key of TOKEN_KEYS) {
    colors[key] = normalizeHex(style.getPropertyValue(`--color-${key}`))
  }
  return colors
}

/** Apply a custom palette as inline CSS vars on <html> (derives accent-soft). */
export function applyCustomColors(colors: CustomColors): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  for (const key of TOKEN_KEYS) {
    if (colors[key]) root.style.setProperty(`--color-${key}`, colors[key])
  }
  if (colors.accent) {
    const [r, g, b] = hexToRgb(colors.accent)
    root.style.setProperty('--color-accent-soft', `rgba(${r}, ${g}, ${b}, 0.12)`)
  }
}

/** Remove the inline custom vars so the active [data-theme] preset takes over. */
export function clearCustomColors(): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  for (const key of TOKEN_KEYS) root.style.removeProperty(`--color-${key}`)
  root.style.removeProperty('--color-accent-soft')
}

export function readCustomTheme(): CustomColors | null {
  try {
    const raw = localStorage.getItem(CUSTOM_THEME_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CustomColors
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function saveCustomTheme(colors: CustomColors): void {
  try {
    localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, JSON.stringify(colors))
  } catch {
    // ignore storage failures (private mode, etc.)
  }
}
