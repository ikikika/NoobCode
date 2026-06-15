// Central registry of selectable color themes. This is the single source of
// truth for the theme picker (preview swatches) and for Monaco (editor colors).
// The matching CSS variable blocks live in `src/styles/index.css` under
// `:root` (cream, the default) and `[data-theme='<id>']` selectors — those drive
// the rest of the UI through the `.nc-*` classes and Tailwind utilities.

export interface ThemeMonaco {
  /** Editor chrome (with leading #). */
  bg: string
  fg: string
  lineNumber: string
  lineHighlight: string
  cursor: string
  /** Token foregrounds (6-hex, no #). */
  comment: string
  keyword: string
  string: string
  number: string
  /** Diff backgrounds (6-hex, no #); alpha is appended in monacoSetup. */
  diffInsert: string
  diffRemove: string
}

export interface Theme {
  id: string
  label: string
  /** True for dark backgrounds — selects Monaco's `vs-dark` base. */
  dark: boolean
  /** Representative colors shown in the picker swatch. */
  preview: { surface: string; accent: string; fg: string }
  monaco: ThemeMonaco
}

export const THEMES: Theme[] = [
  {
    id: 'cream',
    label: 'Cream',
    dark: false,
    preview: { surface: '#faf4e6', accent: '#c2703d', fg: '#3b352a' },
    monaco: {
      bg: '#faf4e6',
      fg: '#3b352a',
      lineNumber: '#9c8f76',
      lineHighlight: '#fffdf5',
      cursor: '#c2703d',
      comment: '9c8f76',
      keyword: 'a85c2e',
      string: '4a7c3f',
      number: 'b07d1a',
      diffInsert: 'e9efd6',
      diffRemove: 'f6e2dc',
    },
  },
  {
    id: 'sand',
    label: 'Sand',
    dark: false,
    preview: { surface: '#f7f5f0', accent: '#1a1a17', fg: '#1a1a17' },
    monaco: {
      bg: '#f7f5f0',
      fg: '#1a1a17',
      lineNumber: '#76726a',
      lineHighlight: '#ffffff',
      cursor: '#1a1a17',
      comment: '76726a',
      keyword: '7a3b12',
      string: '2f6e3f',
      number: '8a6a12',
      diffInsert: 'e6efe2',
      diffRemove: 'f6e0dc',
    },
  },
  {
    id: 'forest',
    label: 'Forest',
    dark: false,
    preview: { surface: '#f3f6ee', accent: '#4f8a3f', fg: '#2c352a' },
    monaco: {
      bg: '#f3f6ee',
      fg: '#2c352a',
      lineNumber: '#8a9579',
      lineHighlight: '#fbfdf7',
      cursor: '#4f8a3f',
      comment: '8a9579',
      keyword: '407030',
      string: '9a6a2e',
      number: '9a7d1a',
      diffInsert: 'e0efdc',
      diffRemove: 'f6e2dc',
    },
  },
  {
    id: 'ocean',
    label: 'Ocean',
    dark: false,
    preview: { surface: '#eef4f7', accent: '#1f7a99', fg: '#233039' },
    monaco: {
      bg: '#eef4f7',
      fg: '#233039',
      lineNumber: '#7d909c',
      lineHighlight: '#f8fbfd',
      cursor: '#1f7a99',
      comment: '7d909c',
      keyword: '15637e',
      string: '2a7d6a',
      number: 'b07d1a',
      diffInsert: 'd9efe9',
      diffRemove: 'f6e2de',
    },
  },
  {
    id: 'rose',
    label: 'Rose',
    dark: false,
    preview: { surface: '#f9f0f2', accent: '#b14a72', fg: '#3a2c30' },
    monaco: {
      bg: '#f9f0f2',
      fg: '#3a2c30',
      lineNumber: '#a08089',
      lineHighlight: '#fdf8f9',
      cursor: '#b14a72',
      comment: 'a08089',
      keyword: '97395d',
      string: '4a7c5f',
      number: 'b07d1a',
      diffInsert: 'e3efe6',
      diffRemove: 'f7e1de',
    },
  },
  {
    id: 'charcoal',
    label: 'Charcoal',
    dark: true,
    preview: { surface: '#211c16', accent: '#e0975a', fg: '#f0e6d2' },
    monaco: {
      bg: '#211c16',
      fg: '#f0e6d2',
      lineNumber: '#877c66',
      lineHighlight: '#2c261e',
      cursor: '#e0975a',
      comment: '8c8069',
      keyword: 'e0975a',
      string: '9ec27a',
      number: 'e0b85e',
      diffInsert: '243019',
      diffRemove: '341f19',
    },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    dark: true,
    preview: { surface: '#161a22', accent: '#6ea8fe', fg: '#e3e8f2' },
    monaco: {
      bg: '#161a22',
      fg: '#e3e8f2',
      lineNumber: '#6f7892',
      lineHighlight: '#1e2430',
      cursor: '#6ea8fe',
      comment: '6f7892',
      keyword: '6ea8fe',
      string: '7fd0a3',
      number: 'e6c267',
      diffInsert: '15281f',
      diffRemove: '2c1820',
    },
  },
  {
    id: 'grape',
    label: 'Grape',
    dark: true,
    preview: { surface: '#1c1726', accent: '#b07cf0', fg: '#ece6f5' },
    monaco: {
      bg: '#1c1726',
      fg: '#ece6f5',
      lineNumber: '#847a99',
      lineHighlight: '#251e33',
      cursor: '#b07cf0',
      comment: '847a99',
      keyword: 'b07cf0',
      string: '9ed4b0',
      number: 'e6c267',
      diffInsert: '1a2a20',
      diffRemove: '2c1820',
    },
  },
]

const THEME_IDS = THEMES.map((t) => t.id)
export type ThemeId = (typeof THEMES)[number]['id']

export const DEFAULT_THEME: ThemeId = 'cream'
export const THEME_STORAGE_KEY = 'noobcode-theme'

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEME_IDS.includes(value)
}
