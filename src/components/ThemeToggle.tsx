import { useTheme, isActiveThemeDark } from '../store/useTheme'

export function ThemeToggle() {
  const theme = useTheme((s) => s.theme)
  const toggleColorScheme = useTheme((s) => s.toggleColorScheme)
  const dark = isActiveThemeDark(theme)

  return (
    <button
      onClick={toggleColorScheme}
      className="nc-iconbtn"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? '☀' : '🌙'}
    </button>
  )
}
