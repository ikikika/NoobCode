import { useMemo, useState } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import type { LanguageId, Problem } from '../../content/schema'
import { MONACO_LANGUAGE } from '../../content/schema'
import { PATTERN_LABELS, type PatternId } from '../../content/patterns'
import { useTheme } from '../../store/useTheme'
import { useUiPrefs } from '../../store/useUiPrefs'
import { useProgressStore } from '../../store/useProgressStore'
import { monacoThemeName } from '../../lib/monacoSetup'

function relativeTime(ts: number, now: number): string {
  const diff = Math.max(0, now - ts)
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface HistoryPanelProps {
  problem: Problem
  language: LanguageId
}

export function HistoryPanel({ problem, language }: HistoryPanelProps) {
  const isDark = useTheme((s) => s.isDark)
  const diffLayout = useUiPrefs((s) => s.diffLayout)
  const attempts = useProgressStore((s) => s.attempts)
  const savedCode = useProgressStore((s) => s.savedCode)
  const now = Date.now()

  // Newest first; only attempts for this problem that captured code.
  const history = useMemo(
    () =>
      attempts
        .filter((a) => a.slug === problem.slug && typeof a.code === 'string')
        .slice()
        .reverse(),
    [attempts, problem.slug],
  )

  const [selected, setSelected] = useState(0)

  if (history.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-fg-subtle">
        No attempt history yet. Run all tests and your submissions will appear here so you can diff
        them against your current code.
      </div>
    )
  }

  const index = Math.min(selected, history.length - 1)
  const attempt = history[index]
  const attemptLanguage = attempt.language ?? language
  const original = attempt.code ?? ''
  const current =
    savedCode[`${problem.slug}:${attemptLanguage}`] || problem.starterCode[attemptLanguage]

  return (
    <div className="flex h-full flex-col">
      <ul className="max-h-40 shrink-0 divide-y divide-line overflow-auto border-b border-line">
        {history.map((a, i) => (
          <li key={a.timestamp}>
            <button
              onClick={() => setSelected(i)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                i === index ? 'bg-surface-sunken' : 'hover:bg-surface-raised'
              }`}
            >
              <span className={a.passed ? 'text-pass' : 'text-fail'}>{a.passed ? '✓' : '✗'}</span>
              <span className="text-fg">{relativeTime(a.timestamp, now)}</span>
              {a.approachUsed && a.approachUsed !== 'unknown' && (
                <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs text-fg-muted">
                  {PATTERN_LABELS[a.approachUsed as PatternId]}
                </span>
              )}
              <span className="ml-auto text-xs uppercase text-fg-subtle">
                {a.language ?? language}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="border-b border-line px-3 py-2 text-xs text-fg-muted">
        Selected attempt vs your current {attemptLanguage} code
      </div>

      <div className="min-h-0 flex-1">
        <DiffEditor
          height="100%"
          language={MONACO_LANGUAGE[attemptLanguage]}
          theme={monacoThemeName(isDark)}
          original={original}
          modified={current}
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
