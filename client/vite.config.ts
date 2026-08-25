import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel exposes the deployed commit via env var (no .git directory in the build
// sandbox); fall back to asking git directly for local dev/builds.
function getGitCommit(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
  }
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

// Setting this before defineConfig runs lets Vite's own env loading pick it up,
// which is what both `import.meta.env.VITE_GIT_COMMIT` and the `%VITE_GIT_COMMIT%`
// placeholder in index.html read from.
process.env.VITE_GIT_COMMIT ??= getGitCommit()

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
