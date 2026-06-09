import { DiffEditor } from '@monaco-editor/react'
import type { LanguageId, Problem } from '../../content/schema'
import { MONACO_LANGUAGE } from '../../content/schema'
import { useTheme } from '../../store/useTheme'
import { useUiPrefs } from '../../store/useUiPrefs'
import { useProgressStore } from '../../store/useProgressStore'
import { monacoThemeName } from '../../lib/monacoSetup'

interface ComparePanelProps {
  problem: Problem
  language: LanguageId
}

export function ComparePanel({ problem, language }: ComparePanelProps) {
  const theme = useTheme((s) => s.theme)
  const diffLayout = useUiPrefs((s) => s.diffLayout)
  const userCode =
    useProgressStore((s) => s.getCode(problem.slug, language)) || problem.starterCode[language]

  const reference = problem.solutions.find((s) => s.technique?.optimal) ?? problem.solutions[0]
  const referenceCode = reference.steps[reference.steps.length - 1].code[language]

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line p-3 text-xs text-fg-muted">
        Your solution vs <span className="font-medium text-fg">{reference.approachName}</span> —
        reference is {reference.timeComplexity} time, {reference.spaceComplexity} space.
      </div>
      <div className="min-h-0 flex-1">
        <DiffEditor
          height="100%"
          language={MONACO_LANGUAGE[language]}
          theme={monacoThemeName(theme)}
          original={referenceCode}
          modified={userCode}
          options={{
            readOnly: true,
            renderSideBySide: diffLayout === 'split',
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}
