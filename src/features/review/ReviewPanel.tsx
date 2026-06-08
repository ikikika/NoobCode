import { PATTERN_LABELS, type PatternId } from '../../content/patterns'
import { useProgressStore } from '../../store/useProgressStore'
import { MarkdownView } from '../../components/MarkdownView'
import type { ApproachId } from '../analysis/types'

function approachLabel(approach: ApproachId): string {
  if (approach === 'unknown') return 'Unknown'
  return PATTERN_LABELS[approach as PatternId]
}

export function ReviewPanel({ slug }: { slug: string }) {
  const review = useProgressStore((s) => s.review[slug])

  if (!review) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-fg-subtle">
        Run all tests to get a review of your approach.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-xs font-medium text-fg">
          {approachLabel(review.approachUsed)}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            review.isOptimal
              ? 'bg-pass-surface text-pass'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
          }`}
        >
          {review.isOptimal ? 'Optimal' : 'Needs work'}
        </span>
        {review.source === 'ai' && (
          <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
            AI coach
          </span>
        )}
        {review.usage && (
          <span className="ml-auto text-xs text-fg-subtle">
            {review.usage.inputTokens + review.usage.outputTokens} tokens · $
            {review.usage.costUsd.toFixed(4)}
          </span>
        )}
      </div>

      {review.prose && <MarkdownView>{review.prose}</MarkdownView>}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-line bg-surface-raised p-3">
          <div className="text-xs text-fg-subtle">Time complexity</div>
          <div className="font-mono text-sm text-fg">{review.estimatedComplexity.time}</div>
        </div>
        <div className="rounded-md border border-line bg-surface-raised p-3">
          <div className="text-xs text-fg-subtle">Space complexity</div>
          <div className="font-mono text-sm text-fg">{review.estimatedComplexity.space}</div>
        </div>
      </div>

      {review.inefficiencies.length > 0 && (
        <div>
          <h3 className="mb-1 text-sm font-semibold text-fg">Inefficiencies</h3>
          <ul className="list-disc pl-5 text-sm text-fg-muted">
            {review.inefficiencies.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {review.suggestions.length > 0 && (
        <div>
          <h3 className="mb-1 text-sm font-semibold text-fg">Suggestions</h3>
          <ul className="list-disc pl-5 text-sm text-fg-muted">
            {review.suggestions.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {review.referenceApproach && (
        <div className="text-sm text-fg-muted">
          <span className="font-semibold text-fg">Reference approach:</span>{' '}
          {review.referenceApproach}
        </div>
      )}

      <p className="mt-auto pt-2 text-[11px] text-fg-subtle">
        Analysis by built-in engine — heuristics estimate complexity from code shape and may not be
        exact.
      </p>
    </div>
  )
}
