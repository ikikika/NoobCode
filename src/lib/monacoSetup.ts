import { loader } from '@monaco-editor/react'
// Import only the editor core plus the two languages we actually use. This
// avoids pulling in Monaco's full language pack (TS/HTML/CSS/JSON workers and
// dozens of Monarch grammars), which would otherwise dominate the bundle.
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution'
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution'
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

// We register only the generic editor worker — the basic-language
// contributions are tokenizer-only and need no dedicated language service.
;(self as typeof globalThis & { MonacoEnvironment?: monaco.Environment }).MonacoEnvironment = {
  getWorker() {
    return new EditorWorker()
  },
}

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
      { token: 'comment', foreground: '8c8069', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'd98a4e' },
      { token: 'string', foreground: '9ec27a' },
      { token: 'number', foreground: 'e0b85e' },
    ],
    colors: {
      'editor.background': '#211c16',
      'editor.foreground': '#f0e6d2',
      'editorLineNumber.foreground': '#877c66',
      'editor.lineHighlightBackground': '#2c261e',
      'editorCursor.foreground': '#d98a4e',
      'diffEditor.insertedTextBackground': '#1f2a1880',
      'diffEditor.removedTextBackground': '#2e1c1680',
      'diffEditor.insertedLineBackground': '#1f2a1840',
      'diffEditor.removedLineBackground': '#2e1c1640',
    },
  })

  monaco.editor.defineTheme('light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '9c8f76', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'a85c2e' },
      { token: 'string', foreground: '4a7c3f' },
      { token: 'number', foreground: 'b07d1a' },
    ],
    colors: {
      'editor.background': '#faf4e6',
      'editor.foreground': '#3b352a',
      'editorLineNumber.foreground': '#9c8f76',
      'editor.lineHighlightBackground': '#fffdf5',
      'editorCursor.foreground': '#c2703d',
      'diffEditor.insertedTextBackground': '#e9efd680',
      'diffEditor.removedTextBackground': '#f6e2dc80',
      'diffEditor.insertedLineBackground': '#e9efd640',
      'diffEditor.removedLineBackground': '#f6e2dc40',
    },
  })
}

export function monacoThemeName(isDark: boolean): 'dark' | 'light' {
  return isDark ? 'dark' : 'light'
}
