import Editor from '@monaco-editor/react'
import type { LanguageId } from '../../content/schema'
import { MONACO_LANGUAGE } from '../../content/schema'
import { useTheme } from '../../store/useTheme'
import { monacoThemeName } from '../../lib/monacoSetup'
import { Spinner } from '../../components/Spinner'

interface CodeEditorProps {
  value: string
  language: LanguageId
  onChange: (value: string) => void
}

export function CodeEditor({ value, language, onChange }: CodeEditorProps) {
  const theme = useTheme((s) => s.theme)

  return (
    <Editor
      height="100%"
      language={MONACO_LANGUAGE[language]}
      theme={monacoThemeName(theme)}
      value={value}
      onChange={(v) => onChange(v ?? '')}
      loading={<Spinner size={24} />}
      options={{
        fontSize: 13,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        padding: { top: 12 },
      }}
    />
  )
}
