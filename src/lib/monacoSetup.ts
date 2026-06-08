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
      { token: 'comment', foreground: '8b96a6', fontStyle: 'italic' },
      { token: 'keyword', foreground: '7aa2ff' },
      { token: 'string', foreground: '9ad07a' },
      { token: 'number', foreground: 'f0a868' },
    ],
    colors: {
      'editor.background': '#1a1a1a',
      'editor.foreground': '#eff1f6',
      'editorLineNumber.foreground': '#808080',
      'editor.lineHighlightBackground': '#282828',
      'editorCursor.foreground': '#ffa116',
      'diffEditor.insertedTextBackground': '#122b1880',
      'diffEditor.removedTextBackground': '#2a121480',
      'diffEditor.insertedLineBackground': '#122b1840',
      'diffEditor.removedLineBackground': '#2a121440',
    },
  })

  monaco.editor.defineTheme('light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
      { token: 'keyword', foreground: '0a7af5' },
      { token: 'string', foreground: '2c9b5b' },
      { token: 'number', foreground: 'c08a00' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#262626',
      'editorLineNumber.foreground': '#9aa0a6',
      'editor.lineHighlightBackground': '#fafafa',
      'editorCursor.foreground': '#ffa116',
      'diffEditor.insertedTextBackground': '#e4f5ec80',
      'diffEditor.removedTextBackground': '#fde7ea80',
      'diffEditor.insertedLineBackground': '#e4f5ec40',
      'diffEditor.removedLineBackground': '#fde7ea40',
    },
  })
}

export function monacoThemeName(isDark: boolean): 'dark' | 'light' {
  return isDark ? 'dark' : 'light'
}
