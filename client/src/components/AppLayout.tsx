import { useState } from 'react'
import { NavLink, Outlet, matchPath, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useBaseInfo } from '@/hooks/useBaseInfo'
import { HealthStatus } from '@/features/health/HealthStatus'
import { SignOutButton } from '@/features/auth/SignOutButton'

function boothIdFromPathname(pathname: string): string | undefined {
  const boothDetail = matchPath('/booth-planner/:boothId', pathname)
  const wallDetail = matchPath('/booth-planner/:boothId/walls/:wallId', pathname)
  return boothDetail?.params.boothId ?? wallDetail?.params.boothId
}

// Tracks the most recently viewed booth so the Booth Planner nav link can jump
// straight back into it — coming back after visiting an unrelated page lands on the
// same booth instead of resetting to the booth list. AppLayout stays mounted across
// route changes, so plain component state here persists for the rest of the session.
// Updated during render (React's documented "adjusting state during render" pattern)
// rather than in an effect, since it only needs to react to the pathname the
// component already saw.
function useLastBoothId(): string | undefined {
  const location = useLocation()
  const [seenPathname, setSeenPathname] = useState(location.pathname)
  const [lastBoothId, setLastBoothId] = useState(() => boothIdFromPathname(location.pathname))

  if (location.pathname !== seenPathname) {
    setSeenPathname(location.pathname)
    const boothId = boothIdFromPathname(location.pathname)
    if (boothId) {
      setLastBoothId(boothId)
    }
  }

  return lastBoothId
}

export function AppLayout() {
  const { session } = useAuth()
  const { data: baseInfo } = useBaseInfo()
  const lastBoothId = useLastBoothId()

  const navItems = [
    { to: '/', label: 'Inventory', end: true },
    {
      to: lastBoothId ? `/booth-planner/${lastBoothId}` : '/booth-planner',
      label: 'Booth Planner',
      end: false,
    },
    { to: '/label-printer', label: 'Label Printer', end: false },
  ]

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
        </ul>
        <div className="app-nav__bottom">
          {baseInfo?.isAdmin && (
            <ul className="app-nav__admin">
              <li>
                <NavLink to="/admin">Admin</NavLink>
              </li>
            </ul>
          )}
          <div className="app-nav__status">
            <HealthStatus />
          </div>
          <div className="app-nav__footer">
            {baseInfo?.name && <p className="app-nav__base">{baseInfo.name}</p>}
            {session?.user.email && <p className="app-nav__email">{session.user.email}</p>}
            <SignOutButton />
          </div>
        </div>
      </nav>
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  )
}
