import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Gallery', end: true },
  { to: '/booth-planner', label: 'Booth Planner', end: false },
]

export function AppLayout() {
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
      </nav>
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  )
}
