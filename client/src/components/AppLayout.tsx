import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useBaseInfo } from '@/hooks/useBaseInfo'
import { HealthStatus } from '@/features/health/HealthStatus'
import { SignOutButton } from '@/features/auth/SignOutButton'

const navItems = [
  { to: '/', label: 'Gallery', end: true },
  { to: '/booth-planner', label: 'Booth Planner', end: false },
]

export function AppLayout() {
  const { session } = useAuth()
  const { data: baseInfo } = useBaseInfo()

  return (
    <div className="app-layout">
      <nav className="app-nav">
        <div className="app-nav__brand">
          <img src="/logo.png" alt="" className="app-nav__logo" />
          <span className="app-nav__wordmark">Tradeshow</span>
        </div>
        <ul>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end}>
                {item.label}
              </NavLink>
            </li>
          ))}
          {baseInfo?.isAdmin && (
            <li>
              <NavLink to="/admin">Admin</NavLink>
            </li>
          )}
        </ul>
        <div className="app-nav__status">
          <HealthStatus />
        </div>
        <div className="app-nav__footer">
          {baseInfo?.name && <p className="app-nav__base">{baseInfo.name}</p>}
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
