import { listBases } from '@/lib/airtable'

export async function getBaseInfo(baseId: string): Promise<{ name: string | null }> {
  const bases = await listBases()
  return { name: bases.find((base) => base.id === baseId)?.name ?? null }
}
