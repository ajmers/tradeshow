import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createBooth, updateBooth, deleteBooth } from '@/api/booths'
import type { CreateBoothInput, UpdateBoothInput } from '@shared'

export function useCreateBooth() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBoothInput) => createBooth(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['booths'] }),
  })
}

export function useUpdateBooth() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBoothInput }) => updateBooth(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['booths'] }),
  })
}

export function useDeleteBooth() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBooth(id),
    onSuccess: () => {
      // Deleting a booth cascades to its walls, their wall assignments, and its
      // floor placements — all need refreshing.
      queryClient.invalidateQueries({ queryKey: ['booths'] })
      queryClient.invalidateQueries({ queryKey: ['walls'] })
      queryClient.invalidateQueries({ queryKey: ['wallAssignments'] })
      queryClient.invalidateQueries({ queryKey: ['floorPlacements'] })
    },
  })
}
