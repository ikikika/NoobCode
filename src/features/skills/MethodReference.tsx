import { useMemo, useState } from 'react'
import { LANGUAGE_LABELS, type LanguageId } from '../../content/schema'
import { useProgressStore } from '../../store/useProgressStore'
import { METHOD_REFERENCE, buildCorpus, isMethodUsed } from './methodReference'

const LANGUAGES: LanguageId[] = ['python', 'javascript', 'typescript']

const selectClass =
  'rounded-md border border-line bg-surface px-2 py-1 text-sm text-fg'

export function MethodReference() {
  const attempts = useProgressStore((s) => s.attempts)
  const lastLanguage = useProgressStore((s) => s.lastLanguage)

  const [language, setLanguage] = useState<LanguageId>(lastLanguage)
  const [structureId, setStructureId] = useState<string>(
    () => METHOD_REFERENCE[lastLanguage][0].id,
  )

  const groups = METHOD_REFERENCE[language]
  const group = groups.find((g) => g.id === structureId) ?? groups[0]

  const corpus = useMemo(() => buildCorpus(attempts, language), [attempts, language])

  const used = useMemo(
    () => group.methods.map((m) => isMethodUsed(corpus, m)),
    [group, corpus],
  )
  const usedCount = used.filter(Boolean).length

  function onLanguageChange(next: LanguageId) {
    setLanguage(next)
    setStructureId(METHOD_REFERENCE[next][0].id)
  }

  return (
    <div className="rounded-lg border border-line bg-surface-raised p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs font-medium text-fg-muted">
          Language
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as LanguageId)}
            className={selectClass}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGE_LABELS[lang]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-medium text-fg-muted">
          Data structure
          <select
            value={group.id}
            onChange={(e) => setStructureId(e.target.value)}
            className={selectClass}
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <span className="ml-auto text-xs text-fg-subtle">
          {usedCount}/{group.methods.length} used before
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-0 text-sm">
        <div className="border-b border-line pb-1 text-xs font-medium text-fg-subtle">Method</div>
        <div className="border-b border-line pb-1 text-xs font-medium text-fg-subtle">
          Description
        </div>
        <div className="border-b border-line pb-1 text-right text-xs font-medium text-fg-subtle">
          Used
        </div>
        {group.methods.map((m, i) => (
          <div key={m.name} className="contents">
            <div className="border-b border-line/60 py-1.5 font-mono text-xs text-fg">{m.name}</div>
            <div className="border-b border-line/60 py-1.5 text-fg-muted">{m.description}</div>
            <div className="border-b border-line/60 py-1.5 text-right">
              {used[i] ? (
                <span className="font-medium text-pass" title="Used in a past submission">
                  ✓
                </span>
              ) : (
                <span className="text-fg-subtle" title="Not used yet">
                  —
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] leading-snug text-fg-subtle">
        “Used” means the method appears in one of your past submissions in this language.
      </p>
    </div>
  )
}
