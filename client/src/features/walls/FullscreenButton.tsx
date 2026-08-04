import { useEffect, useRef, useState, type RefObject } from 'react'

// Toggles the browser Fullscreen API on the returned ref's element (not just CSS —
// this actually takes over the whole screen, letting the 3D canvas use all available
// pixels). Tracks isFullscreen via the fullscreenchange event rather than local state
// alone, since fullscreen can also be exited by the browser itself (e.g. the Esc key).
export function useFullscreenToggle<T extends HTMLElement>(): {
  containerRef: RefObject<T | null>
  isFullscreen: boolean
  toggleFullscreen: () => void
} {
  const containerRef = useRef<T>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current?.requestFullscreen()
    }
  }

  return { containerRef, isFullscreen, toggleFullscreen }
}

export function FullscreenButton({
  isFullscreen,
  onToggle,
}: {
  isFullscreen: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className="booth-3d-fullscreen-button"
      onClick={onToggle}
      title={isFullscreen ? 'Exit fullscreen' : 'Fill the browser tab'}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Fill the browser tab'}
    >
      {isFullscreen ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}
