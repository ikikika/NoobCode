import { useTheme, isActiveThemeDark } from '../store/useTheme'

export function ThemeToggle() {
  const theme = useTheme((s) => s.theme)
  const colorScheme = useTheme((s) => s.colorScheme)
  const cycleColorScheme = useTheme((s) => s.cycleColorScheme)
  const dark = isActiveThemeDark(theme)

  const label =
    colorScheme === 'system'
      ? `System (${dark ? 'dark' : 'light'})`
      : colorScheme === 'dark'
        ? 'Dark'
        : 'Light'

  return (
    <button
      onClick={cycleColorScheme}
      className="nc-iconbtn"
      aria-label={`Color scheme: ${label}. Click to cycle system, light, dark.`}
      title={label}
    >
      {colorScheme === 'system' ? '◐' : dark ? '☀' : '🌙'}
    </button>
  )
}
