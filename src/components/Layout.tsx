import { NavLink, Outlet } from 'react-router-dom'
import { useTheme } from '../store/useTheme'
import { SettingsMenu } from './SettingsMenu'

function navClass({ isActive }: { isActive: boolean }) {
  return `text-sm font-medium transition-colors ${
    isActive ? 'text-accent' : 'text-fg-muted hover:text-fg'
  }`
}

export function Layout() {
  const isDark = useTheme((s) => s.isDark)
  const toggleTheme = useTheme((s) => s.toggleTheme)

  return (
    <div className="flex h-full flex-col bg-surface text-fg">
      <header className="flex items-center gap-6 border-b border-line px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2 text-base font-bold text-fg">
          <span className="text-accent">{'</>'}</span> NoobCode
        </NavLink>
        <nav className="flex items-center gap-4">
          <NavLink to="/problems" className={navClass}>
            Problems
          </NavLink>
          <NavLink to="/skills" className={navClass}>
            Skills
          </NavLink>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-md p-2 text-fg-muted hover:bg-surface-raised hover:text-fg"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <SettingsMenu />
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
