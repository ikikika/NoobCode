import { useEffect, useRef, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import type { LanguageId, Problem } from '../../content/schema'
import { Tabs } from '../../components/Tabs'
import { useProgressStore } from '../../store/useProgressStore'
import { useSolutionStore } from '../../store/useSolutionStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useRunner } from '../runner/useRunner'
import { analyzeCode } from '../analysis/engine'
import { buildReview } from '../analysis/classify'
import { enhanceReview } from '../review/aiReview'
import { CodeEditor } from '../editor/CodeEditor'
import { LanguageSelect } from '../editor/LanguageSelect'
import { ResultsPanel } from '../results/ResultsPanel'
import { StepViewer } from '../steps/StepViewer'
import { ProblemDescription } from './ProblemDescription'
import { ReviewPanel } from '../review/ReviewPanel'
import { ComparePanel } from '../review/ComparePanel'
import { HistoryPanel } from '../review/HistoryPanel'
import { ScratchPanel } from '../scratch/ScratchPanel'
import { useMediaQuery } from '../../lib/useMediaQuery'

type LeftTab = 'description' | 'solution'
type RightTab = 'code' | 'results' | 'review' | 'compare' | 'history' | 'scratch'

export function ProblemDetail({ problem }: { problem: Problem }) {
  const [leftTab, setLeftTab] = useState<LeftTab>('description')
  const [rightTab, setRightTab] = useState<RightTab>('code')

  const lastLanguage = useProgressStore((s) => s.lastLanguage)
  const setLastLanguage = useProgressStore((s) => s.setLastLanguage)
  const saveCode = useProgressStore((s) => s.saveCode)
  const markSolved = useProgressStore((s) => s.markSolved)
  const updateSchedule = useProgressStore((s) => s.updateSchedule)
  const recordAttempt = useProgressStore((s) => s.recordAttempt)
  const storeReview = useProgressStore((s) => s.storeReview)
  const setLastRun = useProgressStore((s) => s.setLastRun)

  const language = useSolutionStore((s) => s.activeLanguage)
  const setLanguage = useSolutionStore((s) => s.setLanguage)
  const resetForProblem = useSolutionStore((s) => s.resetForProblem)

  const aiEnabled = useSettingsStore((s) => s.aiEnabled)
  const apiKey = useSettingsStore((s) => s.apiKey)
  const model = useSettingsStore((s) => s.model)

  const { run, interrupt, status, result, loadingMessage } = useRunner()

  // On problem mount, reset the solution viewer to the persisted language.
  useEffect(() => {
    resetForProblem(lastLanguage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem.slug])

  // Reactive: re-renders when this slug+language code changes (e.g. on Reset).
  const savedValue = useProgressStore((s) => s.savedCode[`${problem.slug}:${language}`])
  const code = savedValue || problem.starterCode[language]

  const onChangeCode = (value: string) => saveCode(problem.slug, language, value)

  const onChangeLanguage = (lang: LanguageId) => {
    setLanguage(lang)
    setLastLanguage(lang)
  }

  const onReset = () => {
    saveCode(problem.slug, language, problem.starterCode[language])
  }

  const handleRun = async (sampleOnly: boolean) => {
    setRightTab('results')
    const fnName = problem.functionName[language]
    const userCode = code
    const tests = sampleOnly ? problem.tests.filter((t) => !t.hidden) : problem.tests

    const runResult = await run({
      language,
      userCode,
      functionName: fnName,
      tests,
      kind: problem.kind,
      io: problem.io,
    })
    if (sampleOnly || !runResult) return

    const passed = runResult.passed
    if (passed) markSolved(problem.slug)
    updateSchedule(problem.slug, passed)
    setLastRun(problem.slug, {
      passed: runResult.cases.filter((c) => c.passed).length,
      total: runResult.cases.length,
    })

    // Fire-and-forget review pipeline.
    void (async () => {
      try {
        const features = await analyzeCode(language, userCode, fnName)
        const heuristicReview = buildReview(features, problem)
        recordAttempt({
          slug: problem.slug,
          timestamp: Date.now(),
          passed,
          approachUsed: heuristicReview.approachUsed,
          language,
          code: userCode,
        })
        storeReview(problem.slug, heuristicReview)
        setRightTab('review')

        if (aiEnabled && apiKey) {
          const enhanced = await enhanceReview(
            heuristicReview,
            { problemTitle: problem.title, language, userCode, passed },
            { apiKey, model },
            {
              // Stream prose into the panel as it arrives.
              onDelta: (proseSoFar) =>
                storeReview(problem.slug, { ...heuristicReview, prose: proseSoFar, source: 'ai' }),
            },
          )
          storeReview(problem.slug, enhanced)
        }
      } catch {
        // Review is best-effort; ignore failures.
      }
    })()
  }

  const busy = status === 'loading' || status === 'running'

  // Stack the panels vertically on narrow screens; side-by-side otherwise.
  const isWide = useMediaQuery('(min-width: 768px)')
  const direction = isWide ? 'horizontal' : 'vertical'

  // Ctrl/Cmd+Enter runs all tests. A ref keeps the listener stable while
  // always invoking the latest handler.
  const runRef = useRef(handleRun)
  runRef.current = handleRun
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        if (!(status === 'loading' || status === 'running')) void runRef.current(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [status])

  return (
    <PanelGroup key={direction} direction={direction} className="h-full">
      <Panel defaultSize={48} minSize={20}>
        <div className="flex h-full flex-col">
          <Tabs
            tabs={[
              { id: 'description', label: 'Description' },
              { id: 'solution', label: 'Solution' },
            ]}
            active={leftTab}
            onChange={(id) => setLeftTab(id as LeftTab)}
          />
          <div className="min-h-0 flex-1">
            {leftTab === 'description' ? (
              <ProblemDescription problem={problem} />
            ) : (
              <StepViewer
                solutions={problem.solutions}
                language={language}
                problemTitle={problem.title}
              />
            )}
          </div>
        </div>
      </Panel>

      <PanelResizeHandle
        className={`bg-line/40 transition-colors hover:bg-accent ${isWide ? 'w-1.5' : 'h-1.5'}`}
      />

      <Panel defaultSize={52} minSize={20}>
        <div className="flex h-full flex-col">
          <div className="flex flex-wrap items-center gap-2 border-b border-line p-2">
            <LanguageSelect value={language} onChange={onChangeLanguage} />
            <button
              onClick={onReset}
              className="rounded-md border border-line px-2.5 py-1 text-xs text-fg-muted hover:text-fg"
            >
              Reset
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => handleRun(true)}
                disabled={busy}
                className="rounded-md border border-line px-3 py-1 text-xs font-medium text-fg hover:bg-surface-raised disabled:opacity-50"
              >
                Run Sample
              </button>
              {busy ? (
                <button
                  onClick={() => interrupt(language)}
                  className="rounded-md border border-fail px-3 py-1 text-xs font-medium text-fail hover:bg-fail-surface"
                >
                  Stop
                </button>
              ) : (
                <button
                  onClick={() => handleRun(false)}
                  title="Run all tests (Ctrl/Cmd+Enter)"
                  className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-contrast hover:bg-accent-hover"
                >
                  Run All
                  <kbd className="rounded border border-accent-contrast/40 px-1 text-[10px] font-normal opacity-80">
                    ⌘⏎
                  </kbd>
                </button>
              )}
            </div>
          </div>

          <Tabs
            tabs={[
              { id: 'code', label: 'Code' },
              { id: 'results', label: 'Results' },
              { id: 'review', label: 'Review' },
              { id: 'compare', label: 'Compare' },
              { id: 'history', label: 'History' },
              { id: 'scratch', label: 'Scratch' },
            ]}
            active={rightTab}
            onChange={(id) => setRightTab(id as RightTab)}
          />

          <div className="min-h-0 flex-1">
            {rightTab === 'code' && (
              <CodeEditor value={code} language={language} onChange={onChangeCode} />
            )}
            {rightTab === 'results' && (
              <ResultsPanel status={status} result={result} loadingMessage={loadingMessage} />
            )}
            {rightTab === 'review' && <ReviewPanel slug={problem.slug} />}
            {rightTab === 'compare' && <ComparePanel problem={problem} language={language} />}
            {rightTab === 'history' && <HistoryPanel problem={problem} language={language} />}
            {rightTab === 'scratch' && <ScratchPanel problem={problem} language={language} />}
          </div>
        </div>
      </Panel>
    </PanelGroup>
  )
}
