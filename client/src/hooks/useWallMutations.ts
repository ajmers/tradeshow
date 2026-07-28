import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createWall } from '@/api/walls'
import type { CreateWallInput } from '@shared'

export function useCreateWall() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateWallInput) => createWall(input),
    onSuccess: () => {
      // Linking a wall to a booth also updates that booth's own `Walls` field
      // in Airtable (symmetric link), so both lists need to refresh.
      queryClient.invalidateQueries({ queryKey: ['walls'] })
      queryClient.invalidateQueries({ queryKey: ['booths'] })
    },
  })
}
