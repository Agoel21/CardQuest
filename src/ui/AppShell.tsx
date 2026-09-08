import { NavLink, Outlet } from 'react-router-dom';
import { useTheme } from './useTheme';
import './AppShell.css';

export function AppShell() {
  const { theme, toggle } = useTheme();

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="topbar__brand">
          CardQuest
        </NavLink>

        <nav className="topbar__nav" aria-label="Games">
          <NavLink to="/klondike">Klondike</NavLink>
          <NavLink to="/crazy-8s">Crazy 8s</NavLink>
          <NavLink to="/freecell">FreeCell</NavLink>
          <NavLink to="/hearts">Hearts</NavLink>
          <NavLink to="/play-a-friend">Play a friend</NavLink>
        </nav>

        <button
          type="button"
          className="topbar__theme"
          onClick={toggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
