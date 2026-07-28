import { z } from 'zod'
import {
  itemSchema,
  type Item,
  type CreateItemInput,
  type UpdateItemInput,
  type UploadItemPhotoInput,
} from '@shared'

async function parseJsonOrThrow<T>(res: Response, schema: z.ZodType<T>, action: string): Promise<T> {
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${action} failed: ${res.status} ${body}`)
  }
  return schema.parse(await res.json())
}

export async function fetchItems(): Promise<Item[]> {
  const res = await fetch('/api/items')
  return parseJsonOrThrow(res, z.array(itemSchema), 'Fetching items')
}

export async function createItem(input: CreateItemInput): Promise<Item> {
  const res = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return parseJsonOrThrow(res, itemSchema, 'Creating item')
}

export async function updateItem(id: string, input: UpdateItemInput): Promise<Item> {
  const res = await fetch(`/api/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return parseJsonOrThrow(res, itemSchema, 'Updating item')
}

export async function deleteItem(id: string): Promise<void> {
  const res = await fetch(`/api/items/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    throw new Error(`Deleting item failed: ${res.status}`)
  }
}

export async function uploadItemPhoto(id: string, input: UploadItemPhotoInput): Promise<Item> {
  const res = await fetch(`/api/items/${id}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return parseJsonOrThrow(res, itemSchema, 'Uploading photo')
}
