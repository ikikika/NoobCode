import type { LanguageId, Solution } from '../../content/schema'

interface SolutionPickerProps {
  solutions: Solution[]
  language: LanguageId
  activeIndex: number
  onChange: (index: number) => void
}

function hasStepsForLanguage(solution: Solution, language: LanguageId): boolean {
  return (solution.steps[language]?.length ?? 0) > 0
}

/** First solution index with steps for `language`, or `-1` if none. */
export function firstSolutionIndexForLanguage(
  solutions: Solution[],
  language: LanguageId,
): number {
  return solutions.findIndex((s) => hasStepsForLanguage(s, language))
}

export function SolutionPicker({
  solutions,
  language,
  activeIndex,
  onChange,
}: SolutionPickerProps) {
  const options = solutions
    .map((solution, index) => ({ solution, index }))
    .filter(({ solution }) => hasStepsForLanguage(solution, language))

  if (options.length === 0) {
    return <span className="text-sm text-fg-muted">No approaches for this language</span>
  }

  const value = options.some(({ index }) => index === activeIndex)
    ? activeIndex
    : options[0]!.index

  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label="Approach"
      className="rounded-md border border-line bg-surface px-2 py-1 text-sm text-fg"
    >
      {options.map(({ solution: s, index }) => (
        <option key={index} value={index}>
          {s.approachName} · {s.timeComplexity}
          {s.technique?.optimal ? ' (optimal)' : ''}
        </option>
      ))}
    </select>
  )
}
