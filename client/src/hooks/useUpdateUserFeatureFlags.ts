import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FeatureFlags } from '@shared'
import { updateUserFeatureFlags } from '@/api/admin'

export function useUpdateUserFeatureFlags() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, featureFlags }: { userId: string; featureFlags: Partial<FeatureFlags> }) =>
      updateUserFeatureFlags(userId, featureFlags),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}
