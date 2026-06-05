import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

let done = false

// Define custom Monaco themes that match the CSS token palette. The theme
// names are simply 'light' and 'dark'.
export function monacoSetup() {
  if (done) return
  done = true

  loader.config({ monaco })

  monaco.editor.defineTheme('dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8b96a6', fontStyle: 'italic' },
      { token: 'keyword', foreground: '7aa2ff' },
      { token: 'string', foreground: '9ad07a' },
      { token: 'number', foreground: 'f0a868' },
    ],
    colors: {
      'editor.background': '#0f1115',
      'editor.foreground': '#e6e8ec',
      'editorLineNumber.foreground': '#6b717c',
      'editor.lineHighlightBackground': '#181b21',
      'editorCursor.foreground': '#5b8cff',
      'diffEditor.insertedTextBackground': '#0f291680',
      'diffEditor.removedTextBackground': '#2a121380',
      'diffEditor.insertedLineBackground': '#0f291640',
      'diffEditor.removedLineBackground': '#2a121340',
    },
  })

  monaco.editor.defineTheme('light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
      { token: 'keyword', foreground: '1f5be0' },
      { token: 'string', foreground: '1a7f37' },
      { token: 'number', foreground: 'b35900' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1a1c20',
      'editorLineNumber.foreground': '#898f99',
      'editor.lineHighlightBackground': '#f7f8fa',
      'editorCursor.foreground': '#2f6df6',
      'diffEditor.insertedTextBackground': '#e6f6ea80',
      'diffEditor.removedTextBackground': '#ffebe980',
      'diffEditor.insertedLineBackground': '#e6f6ea40',
      'diffEditor.removedLineBackground': '#ffebe940',
    },
  })
}

export function monacoThemeName(isDark: boolean): 'dark' | 'light' {
  return isDark ? 'dark' : 'light'
}
