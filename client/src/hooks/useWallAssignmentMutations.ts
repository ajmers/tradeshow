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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wallAssignments'] })
      // Creating an assignment changes the booth's reciprocal `Wall Assignments` link
      // (used for the item count on booth cards), so that cached list goes stale too.
      queryClient.invalidateQueries({ queryKey: ['booths'] })
    },
  })
}

export function useUpdateWallAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWallAssignmentInput }) =>
      updateWallAssignment(id, input),
    onMutate: async ({ id, input }) => {
      // Applied optimistically, synchronously in the cache — so a second drag
      // (e.g. moving the item right after dragging its label) reads this
      // update immediately instead of racing the server round trip.
      await queryClient.cancelQueries({ queryKey: ['wallAssignments'] })
      const previous = queryClient.getQueryData<WallAssignment[]>(['wallAssignments'])
      queryClient.setQueryData<WallAssignment[]>(['wallAssignments'], (current) =>
        current?.map((assignment) =>
          assignment.id === id
            ? { ...assignment, fields: { ...assignment.fields, ...input } }
            : assignment,
        ),
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['wallAssignments'], context.previous)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['wallAssignments'] }),
  })
}

export function useDeleteWallAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWallAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallAssignments'] })
      // Same reciprocal-link reason as create — removing an assignment also changes
      // the booth's item count.
      queryClient.invalidateQueries({ queryKey: ['booths'] })
    },
  })
}
