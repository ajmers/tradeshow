// Every deploy gives each code-split chunk (e.g. AdminPage-<hash>.js) a new hash and
// drops the old file from the server. A tab left open across a deploy still holds the
// old index.html pointing at a chunk that's now gone, so any route it lazy-loads after
// that fails with "Failed to fetch dynamically imported module". The fix is just a
// reload — the new index.html points at the chunks that actually exist — so this
// detects that failure anywhere in the app and reloads once automatically instead of
// leaving the user stuck looking at a dead error.
const RELOAD_FLAG_KEY = 'stale-chunk-reload-attempted'

const CHUNK_LOAD_ERROR_PATTERNS = [
  'failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'importing a module script failed',
]

function isChunkLoadError(message: unknown): boolean {
  if (typeof message !== 'string') {
    return false
  }
  const lower = message.toLowerCase()
  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => lower.includes(pattern))
}

function recoverFromStaleChunk() {
  // Only ever auto-reload once per tab session — if reloading doesn't fix it, the
  // problem isn't a stale deploy, and retrying forever would just loop.
  if (sessionStorage.getItem(RELOAD_FLAG_KEY)) {
    return
  }
  sessionStorage.setItem(RELOAD_FLAG_KEY, '1')
  window.location.reload()
}

export function installStaleChunkRecovery() {
  // Vite's own preload/import polyfill dispatches this for failed module preloads.
  window.addEventListener('vite:preloadError', recoverFromStaleChunk)

  // React Router's route-level `lazy()` imports surface failures as rejected
  // promises, which land here rather than as a caught error anywhere in the app.
  window.addEventListener('unhandledrejection', (event) => {
    if (isChunkLoadError((event.reason as { message?: unknown } | undefined)?.message)) {
      recoverFromStaleChunk()
    }
  })

  // If we're still running 5s after a reload attempt, the reload worked and the app
  // is stable — clear the guard so a genuinely new failure (the next deploy) can
  // still trigger a fresh auto-reload instead of being permanently silenced.
  window.setTimeout(() => sessionStorage.removeItem(RELOAD_FLAG_KEY), 5000)
}
