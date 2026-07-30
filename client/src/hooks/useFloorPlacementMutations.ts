import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createFloorPlacement,
  updateFloorPlacement,
  deleteFloorPlacement,
} from '@/api/floorPlacements'
import type { CreateFloorPlacementInput, UpdateFloorPlacementInput } from '@shared'

export function useCreateFloorPlacement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateFloorPlacementInput) => createFloorPlacement(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['floorPlacements'] }),
  })
}

export function useUpdateFloorPlacement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFloorPlacementInput }) =>
      updateFloorPlacement(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['floorPlacements'] }),
  })
}

export function useDeleteFloorPlacement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteFloorPlacement(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['floorPlacements'] }),
  })
}
