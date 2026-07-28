import { z } from 'zod'
import {
  wallAssignmentSchema,
  type WallAssignment,
  type CreateWallAssignmentInput,
  type UpdateWallAssignmentInput,
} from '@shared'
import { apiFetch } from '@/lib/apiFetch'

export async function fetchWallAssignments(): Promise<WallAssignment[]> {
  const res = await apiFetch('/api/wall-assignments')
  if (!res.ok) {
    throw new Error(`Failed to fetch wall assignments: ${res.status}`)
  }
  return z.array(wallAssignmentSchema).parse(await res.json())
}

export async function createWallAssignment(
  input: CreateWallAssignmentInput,
): Promise<WallAssignment> {
  const res = await apiFetch('/api/wall-assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(`Failed to add item to wall: ${res.status}`)
  }
  return wallAssignmentSchema.parse(await res.json())
}

export async function updateWallAssignment(
  id: string,
  input: UpdateWallAssignmentInput,
): Promise<WallAssignment> {
  const res = await apiFetch(`/api/wall-assignments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(`Failed to update position: ${res.status}`)
  }
  return wallAssignmentSchema.parse(await res.json())
}

export async function deleteWallAssignment(id: string): Promise<void> {
  const res = await apiFetch(`/api/wall-assignments/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    throw new Error(`Failed to remove item from wall: ${res.status}`)
  }
}
