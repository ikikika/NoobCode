import type { Problem } from '../../content/schema'
import { DifficultyBadge } from '../../components/DifficultyBadge'
import { MarkdownView } from '../../components/MarkdownView'

export function ProblemDescription({ problem }: { problem: Problem }) {
  return (
    <div className="flex flex-col gap-4 overflow-auto p-4">
      <div>
        <h1 className="text-xl font-bold text-fg">{problem.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
          {problem.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs text-fg-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <MarkdownView>{problem.description}</MarkdownView>

      {problem.examples.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-fg">Examples</h2>
          <div className="flex flex-col gap-3">
            {problem.examples.map((ex, i) => (
              <div key={i} className="rounded-md border border-line bg-surface-raised p-3 text-sm">
                <div className="font-mono text-xs">
                  <div>
                    <span className="text-fg-subtle">Input: </span>
                    <span className="text-fg">{ex.input}</span>
                  </div>
                  <div>
                    <span className="text-fg-subtle">Output: </span>
                    <span className="text-fg">{ex.output}</span>
                  </div>
                </div>
                {ex.explanation && (
                  <p className="mt-1 text-xs text-fg-muted">{ex.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {problem.constraints.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-fg">Constraints</h2>
          <ul className="list-disc pl-5 text-sm text-fg-muted">
            {problem.constraints.map((c, i) => (
              <li key={i} className="font-mono text-xs">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
