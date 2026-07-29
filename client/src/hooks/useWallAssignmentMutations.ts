import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createWallAssignment,
  updateWallAssignment,
  deleteWallAssignment,
} from '@/api/wallAssignments'
import type { CreateWallAssignmentInput, UpdateWallAssignmentInput, WallAssignment } from '@shared'

export function useCreateWallAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateWallAssignmentInput) => createWallAssignment(input),
    onMutate: async (input) => {
      // Show the item on the canvas immediately rather than waiting on the Airtable
      // round trip — replaced with the real record (real id) once the request settles.
      await queryClient.cancelQueries({ queryKey: ['wallAssignments'] })
      const previous = queryClient.getQueryData<WallAssignment[]>(['wallAssignments'])
      const optimistic: WallAssignment = {
        id: `optimistic-${crypto.randomUUID()}`,
        fields: input,
      }
      queryClient.setQueryData<WallAssignment[]>(['wallAssignments'], (current) => [
        ...(current ?? []),
        optimistic,
      ])
      return { previous }
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['wallAssignments'], context.previous)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['wallAssignments'] }),
  })
}

export function useUpdateWallAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWallAssignmentInput }) =>
      updateWallAssignment(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallAssignments'] }),
  })
}

export function useDeleteWallAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWallAssignment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallAssignments'] }),
  })
}
