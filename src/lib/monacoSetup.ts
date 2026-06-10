import { loader } from '@monaco-editor/react'
// Import only the editor core plus the two languages we actually use. This
// avoids pulling in Monaco's full language pack (TS/HTML/CSS/JSON workers and
// dozens of Monarch grammars), which would otherwise dominate the bundle.
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import { THEMES, DEFAULT_THEME, type ThemeId } from './themes'
import { readCustomTheme, isDarkColor, type CustomColors } from '../features/theme/customTheme'

// We register only the generic editor worker — the basic-language
// contributions are tokenizer-only and need no dedicated language service.
;(self as typeof globalThis & { MonacoEnvironment?: monaco.Environment }).MonacoEnvironment = {
  getWorker() {
    return new EditorWorker()
  },
}

let done = false

// Register one Monaco theme per selectable app theme, named by its id. Colors
// are derived from the shared registry in `./themes` so the editor matches the
// surrounding CSS token palette.
export function monacoSetup() {
  if (done) return
  done = true

  loader.config({ monaco })

  for (const theme of THEMES) {
    const m = theme.monaco
    monaco.editor.defineTheme(theme.id, {
      base: theme.dark ? 'vs-dark' : 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: m.comment, fontStyle: 'italic' },
        { token: 'keyword', foreground: m.keyword },
        { token: 'string', foreground: m.string },
        { token: 'number', foreground: m.number },
      ],
      colors: {
        'editor.background': m.bg,
        'editor.foreground': m.fg,
        'editorLineNumber.foreground': m.lineNumber,
        'editor.lineHighlightBackground': m.lineHighlight,
        'editorCursor.foreground': m.cursor,
        'diffEditor.insertedTextBackground': `#${m.diffInsert}80`,
        'diffEditor.removedTextBackground': `#${m.diffRemove}80`,
        'diffEditor.insertedLineBackground': `#${m.diffInsert}40`,
        'diffEditor.removedLineBackground': `#${m.diffRemove}40`,
      },
    })
  }

  const custom = readCustomTheme()
  if (custom) defineCustomMonacoTheme(custom)
}

const noHash = (hex: string) => (hex || '#000000').replace('#', '')

/** Build (or rebuild) the 'custom' Monaco theme from a user palette. */
export function defineCustomMonacoTheme(c: CustomColors) {
  monaco.editor.defineTheme('custom', {
    base: isDarkColor(c.surface || '#ffffff') ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: noHash(c['fg-subtle']), fontStyle: 'italic' },
      { token: 'keyword', foreground: noHash(c.accent) },
      { token: 'string', foreground: noHash(c.pass) },
      { token: 'number', foreground: noHash(c.medium) },
    ],
    colors: {
      'editor.background': c.surface,
      'editor.foreground': c.fg,
      'editorLineNumber.foreground': c['fg-subtle'],
      'editor.lineHighlightBackground': c['surface-raised'],
      'editorCursor.foreground': c.accent,
      'diffEditor.insertedTextBackground': `#${noHash(c['pass-surface'])}80`,
      'diffEditor.removedTextBackground': `#${noHash(c['fail-surface'])}80`,
      'diffEditor.insertedLineBackground': `#${noHash(c['pass-surface'])}40`,
      'diffEditor.removedLineBackground': `#${noHash(c['fail-surface'])}40`,
    },
  })
}

export function monacoThemeName(theme: ThemeId | 'custom'): string {
  if (theme === 'custom') return readCustomTheme() ? 'custom' : DEFAULT_THEME
  return THEMES.some((t) => t.id === theme) ? theme : DEFAULT_THEME
}
