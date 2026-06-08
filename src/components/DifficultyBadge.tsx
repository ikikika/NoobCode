import type { Difficulty } from '../content/schema'

const STYLES: Record<Difficulty, string> = {
  easy: 'bg-easy-surface text-easy',
  medium: 'bg-medium-surface text-medium',
  hard: 'bg-hard-surface text-hard',
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
