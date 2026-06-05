import { useEffect, useState } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import type { LanguageId, Solution } from '../../content/schema'
import { MONACO_LANGUAGE } from '../../content/schema'
import { useTheme } from '../../store/useTheme'
import { useUiPrefs } from '../../store/useUiPrefs'
import { useSolutionStore } from '../../store/useSolutionStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { monacoThemeName } from '../../lib/monacoSetup'
import { MarkdownView } from '../../components/MarkdownView'
import { Spinner } from '../../components/Spinner'
import { explainStep } from '../review/aiReview'
import { SolutionPicker } from './SolutionPicker'

interface StepViewerProps {
  solutions: Solution[]
  language: LanguageId
  problemTitle: string
}

export function StepViewer({ solutions, language, problemTitle }: StepViewerProps) {
  const isDark = useTheme((s) => s.isDark)
  const diffLayout = useUiPrefs((s) => s.diffLayout)
  const toggleDiffLayout = useUiPrefs((s) => s.toggleDiffLayout)

  const activeSolutionIndex = useSolutionStore((s) => s.activeSolutionIndex)
  const activeStepIndex = useSolutionStore((s) => s.activeStepIndex)
  const setSolutionIndex = useSolutionStore((s) => s.setSolutionIndex)
  const setStepIndex = useSolutionStore((s) => s.setStepIndex)

  const aiEnabled = useSettingsStore((s) => s.aiEnabled)
  const apiKey = useSettingsStore((s) => s.apiKey)
  const model = useSettingsStore((s) => s.model)

  const solution = solutions[Math.min(activeSolutionIndex, solutions.length - 1)]
  const stepIndex = Math.min(activeStepIndex, solution.steps.length - 1)
  const step = solution.steps[stepIndex]

  const original = stepIndex > 0 ? solution.steps[stepIndex - 1].code[language] : ''
  const modified = step.code[language]

  const [explanation, setExplanation] = useState<string | null>(null)
  const [explaining, setExplaining] = useState(false)

  // Clear any AI explanation when the step, solution, or language changes.
  useEffect(() => {
    setExplanation(null)
    setExplaining(false)
  }, [activeSolutionIndex, stepIndex, language])

  const onExplain = async () => {
    setExplaining(true)
    const text = await explainStep(
      { problemTitle, language, code: modified, stepTitle: step.title },
      { apiKey, model },
    )
    setExplanation(text ?? 'Could not fetch an explanation right now.')
    setExplaining(false)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
        <SolutionPicker
          solutions={solutions}
          activeIndex={activeSolutionIndex}
          onChange={setSolutionIndex}
        />
        <span className="text-xs text-fg-subtle">
          {solution.timeComplexity} time · {solution.spaceComplexity} space
        </span>
        <button
          onClick={toggleDiffLayout}
          className="ml-auto rounded-md border border-line px-2 py-1 text-xs text-fg-muted hover:text-fg"
        >
          {diffLayout === 'split' ? 'Inline diff' : 'Split diff'}
        </button>
      </div>

      <div className="min-h-0 flex-1">
        <DiffEditor
          height="100%"
          language={MONACO_LANGUAGE[language]}
          theme={monacoThemeName(isDark)}
          original={original}
          modified={modified}
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

      <div className="border-t border-line p-3">
        <div className="mb-2 flex items-center gap-2">
          <button
            onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
            disabled={stepIndex === 0}
            className="rounded-md border border-line px-2 py-1 text-xs text-fg-muted disabled:opacity-40 hover:text-fg"
          >
            ‹ Prev
          </button>
          <div className="flex items-center gap-1.5">
            {solution.steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStepIndex(i)}
                aria-label={`Step ${i + 1}`}
                className={`h-2 w-2 rounded-full ${i === stepIndex ? 'bg-accent' : 'bg-line'}`}
              />
            ))}
          </div>
          <button
            onClick={() => setStepIndex(Math.min(solution.steps.length - 1, stepIndex + 1))}
            disabled={stepIndex === solution.steps.length - 1}
            className="rounded-md border border-line px-2 py-1 text-xs text-fg-muted disabled:opacity-40 hover:text-fg"
          >
            Next ›
          </button>
          <span className="ml-auto text-xs text-fg-subtle">
            Step {stepIndex + 1} / {solution.steps.length}
          </span>
        </div>
        {step.title && <h3 className="mb-1 text-sm font-semibold text-fg">{step.title}</h3>}
        <MarkdownView>{step.explanation}</MarkdownView>

        {aiEnabled && apiKey && (
          <div className="mt-3">
            <button
              onClick={onExplain}
              disabled={explaining}
              className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-xs text-accent hover:bg-surface-raised disabled:opacity-50"
            >
              {explaining && <Spinner size={12} />}
              Explain this step
            </button>
            {explanation && (
              <div className="mt-2 rounded-md bg-surface-sunken p-3">
                <MarkdownView>{explanation}</MarkdownView>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
