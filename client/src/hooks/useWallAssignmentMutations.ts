import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createWallAssignment,
  updateWallAssignment,
  deleteWallAssignment,
} from '@/api/wallAssignments'
import type { CreateWallAssignmentInput, UpdateWallAssignmentInput } from '@shared'

export function useCreateWallAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateWallAssignmentInput) => createWallAssignment(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallAssignments'] }),
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
