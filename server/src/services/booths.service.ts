import { boothSchema, type Booth, type BoothFields } from '@shared'
import { listAllRecords } from '@/lib/airtable'

const TABLE = 'Booths'

export async function listBooths(baseId: string): Promise<Booth[]> {
  const records = await listAllRecords<BoothFields>(baseId, TABLE)
  return records.map((record) => boothSchema.parse(record))
}
