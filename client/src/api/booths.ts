import { z } from 'zod'
import { boothSchema, type Booth, type CreateBoothInput, type UpdateBoothInput } from '@shared'
import { apiFetch } from '@/lib/apiFetch'

export async function fetchBooths(): Promise<Booth[]> {
  const res = await apiFetch('/api/booths')
  if (!res.ok) {
    throw new Error(`Failed to fetch booths: ${res.status}`)
  }
  return z.array(boothSchema).parse(await res.json())
}

export async function createBooth(input: CreateBoothInput): Promise<Booth> {
  const res = await apiFetch('/api/booths', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(`Failed to create booth: ${res.status}`)
  }
  return boothSchema.parse(await res.json())
}

export async function updateBooth(id: string, input: UpdateBoothInput): Promise<Booth> {
  const res = await apiFetch(`/api/booths/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(`Failed to update booth: ${res.status}`)
  }
  return boothSchema.parse(await res.json())
}
