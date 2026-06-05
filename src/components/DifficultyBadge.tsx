import type { Difficulty } from '../content/schema'

const STYLES: Record<Difficulty, string> = {
  easy: 'bg-pass-surface text-pass',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  hard: 'bg-fail-surface text-fail',
}

const LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[difficulty]}`}>
      {LABELS[difficulty]}
    </span>
  )
}
