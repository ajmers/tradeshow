import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateUserBase } from '@/api/admin'

export function useUpdateUserBase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, airtableBaseId }: { userId: string; airtableBaseId: string }) =>
      updateUserBase(userId, airtableBaseId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })
}
