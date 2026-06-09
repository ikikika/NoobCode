import type { MouseEvent } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { SettingsMenu } from './SettingsMenu'

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'on' : undefined
}

export function Layout() {
  // Hash routing makes an `href="#main"` skip link change the route, so move
  // focus to the main landmark programmatically instead.
  const skipToContent = (e: MouseEvent) => {
    e.preventDefault()
    const main = document.getElementById('main-content')
    if (main) {
      main.focus()
      main.scrollIntoView()
    }
  }

  return (
    <div className="nc flex h-full flex-col">
      <a href="#main-content" className="nc-skip" onClick={skipToContent}>
        Skip to content
      </a>
      <header className="nc-head">
        <Link to="/" className="nc-wordmark">
          <span className="br">{'</>'}</span> NoobCode
        </Link>
        <nav className="nc-nav" aria-label="Primary">
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
      <main id="main-content" tabIndex={-1} className="nc-main min-h-0 flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
