import { consignerSchema, type Consigner, type ConsignerFields } from '@shared'
import { listAllRecords } from '@/lib/airtable'

const TABLE = 'Consigners'

export async function listConsigners(baseId: string): Promise<Consigner[]> {
  const records = await listAllRecords<ConsignerFields>(baseId, TABLE)
  return records.map((record) => consignerSchema.parse(record))
}
