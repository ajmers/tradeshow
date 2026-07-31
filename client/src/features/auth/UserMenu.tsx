import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'

export function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="user-menu__email">{email}</span>
        <span aria-hidden="true">⋯</span>
      </button>
      {open && (
        // Opens upward, not downward like BoothActionsMenu's dropdown — this
        // trigger sits at the bottom of the sidebar, so a downward menu would
        // overflow past the viewport.
        <div className="user-menu__dropdown" role="menu">
          <NavLink to="/settings" role="menuitem" onClick={() => setOpen(false)}>
            Settings
          </NavLink>
        </div>
      )}
    </div>
  )
}
