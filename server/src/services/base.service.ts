import type { BaseInfo } from '@shared'
import { listBases } from '@/lib/airtable'

export async function getBaseInfo(baseId: string): Promise<BaseInfo> {
  const bases = await listBases()
  return { name: bases.find((base) => base.id === baseId)?.name ?? null }
}
