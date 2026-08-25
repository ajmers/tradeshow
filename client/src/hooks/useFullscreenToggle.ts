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
