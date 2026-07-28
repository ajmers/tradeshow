import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createItem, updateItem, deleteItem, uploadItemPhoto } from '@/api/items'
import type { CreateItemInput, UpdateItemInput, UploadItemPhotoInput } from '@shared'

export function useCreateItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateItemInput) => createItem(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateItemInput }) => updateItem(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  })
}

export function useUploadItemPhoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UploadItemPhotoInput }) =>
      uploadItemPhoto(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  })
}
