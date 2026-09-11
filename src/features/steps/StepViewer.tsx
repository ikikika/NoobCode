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
import { LanguageSelect } from '../editor/LanguageSelect'
import { explainStep } from '../review/aiReview'
import { SolutionPicker, firstSolutionIndexForLanguage } from './SolutionPicker'

interface StepViewerProps {
  solutions: Solution[]
  language: LanguageId
  onChangeLanguage: (language: LanguageId) => void
  problemTitle: string
  isFullscreen?: boolean
  onToggleFullscreen?: () => void
}

export function StepViewer({
  solutions,
  language,
  onChangeLanguage,
  problemTitle,
  isFullscreen,
  onToggleFullscreen,
}: StepViewerProps) {
  const theme = useTheme((s) => s.theme)
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
  const steps = solution?.steps[language]
  const hasSteps = (steps?.length ?? 0) > 0

  // If the active approach has no steps for this language, jump to the first that does.
  useEffect(() => {
    if (hasSteps) return
    const next = firstSolutionIndexForLanguage(solutions, language)
    if (next >= 0 && next !== activeSolutionIndex) setSolutionIndex(next)
  }, [hasSteps, solutions, language, activeSolutionIndex, setSolutionIndex])

  const [explanation, setExplanation] = useState<string | null>(null)
  const [explaining, setExplaining] = useState(false)

  // Clear any AI explanation when the step, solution, or language changes.
  useEffect(() => {
    setExplanation(null)
    setExplaining(false)
  }, [activeSolutionIndex, activeStepIndex, language])

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
      <LanguageSelect value={language} onChange={onChangeLanguage} />
      <SolutionPicker
        solutions={solutions}
        language={language}
        activeIndex={activeSolutionIndex}
        onChange={setSolutionIndex}
      />
      {hasSteps && solution && (
        <span className="text-xs text-fg-subtle">
          {solution.timeComplexity} time · {solution.spaceComplexity} space
        </span>
      )}
      {hasSteps && (
        <button
          onClick={toggleDiffLayout}
          className="ml-auto rounded-md border border-line px-2 py-1 text-xs text-fg-muted hover:text-fg"
        >
          {diffLayout === 'split' ? 'Inline diff' : 'Split diff'}
        </button>
      )}
      {onToggleFullscreen && (
        <button
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          className={`rounded-md border border-line px-2 py-1 text-xs text-fg-muted hover:text-fg ${hasSteps ? '' : 'ml-auto'}`}
        >
          {isFullscreen ? 'Exit fullscreen ✕' : 'Fullscreen ⤢'}
        </button>
      )}
    </div>
  )

  if (!hasSteps || !solution || !steps) {
    return (
      <div className="flex h-full flex-col">
        {toolbar}
        <div className="flex flex-1 flex-col items-center justify-center gap-1 p-6 text-center">
          <p className="text-sm text-fg-muted">No walkthrough for this language yet</p>
        </div>
      </div>
    )
  }

  const stepIndex = Math.min(activeStepIndex, steps.length - 1)
  const step = steps[stepIndex]

  const original = stepIndex > 0 ? steps[stepIndex - 1].code : ''
  const modified = step.code

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
      {toolbar}

      <div className="min-h-0 flex-1">
        <DiffEditor
          height="100%"
          language={MONACO_LANGUAGE[language]}
          theme={monacoThemeName(theme)}
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
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStepIndex(i)}
                aria-label={`Step ${i + 1}`}
                className={`h-2 w-2 rounded-full ${i === stepIndex ? 'bg-accent' : 'bg-line'}`}
              />
            ))}
          </div>
          <button
            onClick={() => setStepIndex(Math.min(steps.length - 1, stepIndex + 1))}
            disabled={stepIndex === steps.length - 1}
            className="rounded-md border border-line px-2 py-1 text-xs text-fg-muted disabled:opacity-40 hover:text-fg"
          >
            Next ›
          </button>
          <span className="ml-auto text-xs text-fg-subtle">
            Step {stepIndex + 1} / {steps.length}
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
