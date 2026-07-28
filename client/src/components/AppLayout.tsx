import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { SignOutButton } from '@/features/auth/SignOutButton'

const navItems = [
  { to: '/', label: 'Gallery', end: true },
  { to: '/booth-planner', label: 'Booth Planner', end: false },
]

export function AppLayout() {
  const { session } = useAuth()

  return (
    <div className="app-layout">
      <nav className="app-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="app-nav__footer">
          {session?.user.email && <p className="app-nav__email">{session.user.email}</p>}
          <SignOutButton />
        </div>
      </nav>
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  )
}
