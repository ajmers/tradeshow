import { useState } from 'react'
import { NavLink, Outlet, matchPath, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useBaseInfo } from '@/hooks/useBaseInfo'
import { useLabelLogo } from '@/hooks/useLabelLogo'
import { HealthStatus } from '@/features/health/HealthStatus'
import { SignOutButton } from '@/features/auth/SignOutButton'
import { UserMenu } from '@/features/auth/UserMenu'

function boothIdFromPathname(pathname: string): string | undefined {
  const boothDetail = matchPath('/booth-planner/:boothId', pathname)
  const wallDetail = matchPath('/booth-planner/:boothId/walls/:wallId', pathname)
  return boothDetail?.params.boothId ?? wallDetail?.params.boothId
}

const LAST_BOOTH_STORAGE_PREFIX = 'tradeshow:lastBoothId:'

// Keyed per user (not a single shared key) so that on a browser shared by multiple
// accounts, signing in as someone else never surfaces the previous user's booth —
// each account only ever reads and writes its own entry.
function readStoredBoothId(userId: string | undefined): string | undefined {
  if (!userId) {
    return undefined
  }
  try {
    return localStorage.getItem(LAST_BOOTH_STORAGE_PREFIX + userId) ?? undefined
  } catch {
    return undefined
  }
}

function writeStoredBoothId(userId: string | undefined, boothId: string): void {
  if (!userId) {
    return
  }
  try {
    localStorage.setItem(LAST_BOOTH_STORAGE_PREFIX + userId, boothId)
  } catch {
    // Storage full/unavailable (e.g. private browsing) — the nav link just won't
    // persist across reloads.
  }
}

// Tracks the most recently viewed booth so the Booth Planner nav link can jump
// straight back into it — coming back after visiting an unrelated page lands on the
// same booth instead of resetting to the booth list. Persisted to localStorage
// (per user) so it also survives a full page reload, not just in-app navigation.
// Note this is just a shortcut, not a trust boundary: BoothDetailPage/WallDetailPage
// independently verify the booth actually belongs to the signed-in user and redirect
// home if not, so a stale or foreign id here can't land anyone on someone else's page.
// Updated during render (React's documented "adjusting state during render" pattern)
// rather than in an effect, since it only needs to react to the pathname the
// component already saw.
function useLastBoothId(userId: string | undefined): string | undefined {
  const location = useLocation()
  const [seenPathname, setSeenPathname] = useState(location.pathname)
  const [lastBoothId, setLastBoothId] = useState(
    () => boothIdFromPathname(location.pathname) ?? readStoredBoothId(userId),
  )

  if (location.pathname !== seenPathname) {
    setSeenPathname(location.pathname)
    const boothId = boothIdFromPathname(location.pathname)
    if (boothId) {
      setLastBoothId(boothId)
      writeStoredBoothId(userId, boothId)
    }
  }

  return lastBoothId
}

export function AppLayout() {
  const { session } = useAuth()
  const { data: baseInfo } = useBaseInfo()
  const { data: labelLogo } = useLabelLogo()
  const lastBoothId = useLastBoothId(session?.user.id)

  // Defaults to enabled while base info is still loading, so the link doesn't flash
  // away and back once it resolves (it's normally already cached before this renders).
  const labelPrinterEnabled = baseInfo?.featureFlags.labelPrinter ?? true

  const navItems = [
    { to: '/', label: 'Inventory', end: true },
    {
      to: lastBoothId ? `/booth-planner/${lastBoothId}` : '/booth-planner',
      label: 'Booth Planner',
      end: false,
    },
    ...(labelPrinterEnabled ? [{ to: '/label-printer', label: 'Label Printer', end: false }] : []),
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
          {baseInfo?.isAdmin ? (
            <div className="app-nav__status">
              <HealthStatus />
            </div>
          ) : (
            labelLogo && (
              <div className="app-nav__status">
                <img src={labelLogo} alt="" className="app-nav__status-logo" />
              </div>
            )
          )}
          <div className="app-nav__footer">
            {baseInfo?.name && <p className="app-nav__base">{baseInfo.name}</p>}
            {session?.user.email && <UserMenu email={session.user.email} />}
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
