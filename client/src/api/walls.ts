import { z } from 'zod'
import { wallSchema, type Wall, type CreateWallInput } from '@shared'
import { apiFetch } from '@/lib/apiFetch'

export async function fetchWalls(): Promise<Wall[]> {
  const res = await apiFetch('/api/walls')
  if (!res.ok) {
    throw new Error(`Failed to fetch walls: ${res.status}`)
  }
  return z.array(wallSchema).parse(await res.json())
}

export async function createWall(input: CreateWallInput): Promise<Wall> {
  const res = await apiFetch('/api/walls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(`Failed to create wall: ${res.status}`)
  }
  return wallSchema.parse(await res.json())
}
