import type { Solution } from '../../content/schema'

interface SolutionPickerProps {
  solutions: Solution[]
  activeIndex: number
  onChange: (index: number) => void
}

export function SolutionPicker({ solutions, activeIndex, onChange }: SolutionPickerProps) {
  return (
    <select
      value={activeIndex}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-md border border-line bg-surface px-2 py-1 text-sm text-fg"
    >
      {solutions.map((s, i) => (
        <option key={i} value={i}>
          {s.approachName} · {s.timeComplexity}
          {s.technique?.optimal ? ' (optimal)' : ''}
        </option>
      ))}
    </select>
  )
}
