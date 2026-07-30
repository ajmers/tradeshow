import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { AuthGate } from '@/features/auth/AuthGate'
import { installStaleChunkRecovery } from '@/lib/staleChunkRecovery'
import '@/index.css'

installStaleChunkRecovery()

const queryClient = new QueryClient()

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <AuthGate>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </AuthGate>
    </AuthProvider>
  </StrictMode>,
)
