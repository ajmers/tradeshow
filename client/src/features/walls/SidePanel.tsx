import type { ReactNode } from 'react'

interface SidePanelProps {
  isOpen: boolean
  onToggle: () => void
  label: string
  children: ReactNode
}

// A collapsible panel pinned to the viewport's right edge. Generic over its
// content — WallDetailPage uses it to show "Available items" there, but it
// doesn't know or care what's inside.
export function SidePanel({ isOpen, onToggle, label, children }: SidePanelProps) {
  return (
    <aside className={isOpen ? 'side-panel' : 'side-panel side-panel--collapsed'}>
      <button
        type="button"
        className="side-panel__toggle"
        onClick={onToggle}
        aria-label={isOpen ? `Collapse ${label}` : `Expand ${label}`}
      >
        {isOpen ? '»' : '«'}
      </button>
      {isOpen && <div className="side-panel__content">{children}</div>}
    </aside>
  )
}
