import type { Difficulty } from '../content/schema'

const LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <span className={`nc-diff ${difficulty}`}>{LABELS[difficulty]}</span>
}
