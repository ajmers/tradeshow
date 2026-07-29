import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createBooth } from '@/api/booths'
import type { CreateBoothInput } from '@shared'

export function useCreateBooth() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateBoothInput) => createBooth(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['booths'] }),
  })
}
