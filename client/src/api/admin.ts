import { z } from 'zod'
import {
  adminUserSchema,
  airtableBaseSummarySchema,
  type AdminUser,
  type AirtableBaseSummary,
} from '@shared'
import { apiFetch } from '@/lib/apiFetch'

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await apiFetch('/api/admin/users')
  if (!res.ok) {
    throw new Error(`Failed to fetch users: ${res.status}`)
  }
  return z.array(adminUserSchema).parse(await res.json())
}

export async function fetchAdminBases(): Promise<AirtableBaseSummary[]> {
  const res = await apiFetch('/api/admin/bases')
  if (!res.ok) {
    throw new Error(`Failed to fetch bases: ${res.status}`)
  }
  return z.array(airtableBaseSummarySchema).parse(await res.json())
}

export async function updateUserBase(userId: string, airtableBaseId: string): Promise<void> {
  const res = await apiFetch(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ airtableBaseId }),
  })
  if (!res.ok) {
    throw new Error(`Failed to update user: ${res.status}`)
  }
}
