import { Link, NavLink, Outlet } from 'react-router-dom'
import { SettingsMenu } from './SettingsMenu'

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'on' : undefined
}

export function Layout() {
  return (
    <div className="nc flex h-full flex-col">
      <header className="nc-head">
        <Link to="/" className="nc-wordmark">
          <span className="br">{'</>'}</span> NoobCode
        </Link>
        <nav className="nc-nav">
          <NavLink to="/problems" className={navClass}>
            Problems
          </NavLink>
          <NavLink to="/skills" className={navClass}>
            Skills
          </NavLink>
        </nav>
        <div className="nc-head-actions">
          <Link to="/new" className="nc-iconbtn" aria-label="New problem" title="New problem">
            +
          </Link>
          <SettingsMenu />
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
