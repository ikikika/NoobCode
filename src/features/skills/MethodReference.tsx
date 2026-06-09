import { useMemo, useState } from 'react'
import { LANGUAGE_LABELS, type LanguageId } from '../../content/schema'
import { useProgressStore } from '../../store/useProgressStore'
import { METHOD_REFERENCE, buildCorpus, isMethodUsed } from './methodCatalog'

const LANGUAGES: LanguageId[] = ['python', 'javascript', 'typescript']

const selectStyle: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: '0.02em',
  color: 'var(--color-fg)',
  background: 'var(--color-surface-sunken)',
  border: 'none',
  borderRadius: 999,
  padding: '4px 9px',
  cursor: 'pointer',
}

export function MethodReference() {
  const attempts = useProgressStore((s) => s.attempts)
  const lastLanguage = useProgressStore((s) => s.lastLanguage)

  const [language, setLanguage] = useState<LanguageId>(lastLanguage)
  const [structureId, setStructureId] = useState<string>(() => METHOD_REFERENCE[lastLanguage][0].id)

  const groups = METHOD_REFERENCE[language]
  const group = groups.find((g) => g.id === structureId) ?? groups[0]

  const corpus = useMemo(() => buildCorpus(attempts, language), [attempts, language])
  const used = useMemo(() => group.methods.map((m) => isMethodUsed(corpus, m)), [group, corpus])
  const usedCount = used.filter(Boolean).length

  function onLanguageChange(next: LanguageId) {
    setLanguage(next)
    setStructureId(METHOD_REFERENCE[next][0].id)
  }

  return (
    <div className="nc-card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--color-fg-muted)' }}>
          Language
          <select
            aria-label="Language"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as LanguageId)}
            style={selectStyle}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGE_LABELS[lang]}
              </option>
            ))}
          </select>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--color-fg-muted)' }}>
          Structure
          <select
            aria-label="Data structure"
            value={group.id}
            onChange={(e) => setStructureId(e.target.value)}
            style={selectStyle}
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </span>
        <span className="nc-mono" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-fg-subtle)' }}>
          {usedCount}/{group.methods.length} used
        </span>
      </div>
      <div className="nc-divide">
        {group.methods.map((m, i) => (
          <div
            key={m.name}
            style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr auto',
              gap: 16,
              alignItems: 'center',
              padding: '9px 0',
            }}
          >
            <span className="nc-mono" style={{ fontSize: 12.5, color: 'var(--color-fg)' }}>
              {m.name}
            </span>
            <span style={{ fontSize: 13, color: 'var(--color-fg-muted)' }}>{m.description}</span>
            <span
              style={{ fontSize: 13, color: used[i] ? 'var(--color-pass)' : 'var(--color-fg-subtle)' }}
              title={used[i] ? 'Used in a past submission' : 'Not used yet'}
            >
              {used[i] ? '✓' : '—'}
            </span>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 12, fontSize: 11, lineHeight: 1.4, color: 'var(--color-fg-subtle)' }}>
        “Used” means the method appears in one of your past submissions in this language.
      </p>
    </div>
  )
}
