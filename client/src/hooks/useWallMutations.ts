import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createWall, updateWall } from '@/api/walls'
import type { CreateWallInput, UpdateWallInput } from '@shared'

export function useCreateWall() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateWallInput) => createWall(input),
    onSuccess: () => {
      // Linking a wall to a booth (via its `Booths` field) updates the booth's
      // reciprocal `Walls` field in Airtable too, so both queries need refreshing.
      queryClient.invalidateQueries({ queryKey: ['walls'] })
      queryClient.invalidateQueries({ queryKey: ['booths'] })
    },
  })
}

export function useUpdateWall() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWallInput }) => updateWall(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['walls'] }),
  })
}
