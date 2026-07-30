import { QueryClient } from '@tanstack/react-query'

// A module-level singleton (rather than one created inside main.tsx) so
// AuthProvider — which sits above QueryClientProvider in the tree and can't use
// useQueryClient() — can still clear cached data on sign-out.
export const queryClient = new QueryClient()
