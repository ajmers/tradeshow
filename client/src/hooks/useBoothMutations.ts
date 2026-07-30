import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createBooth, updateBooth } from '@/api/booths'
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
