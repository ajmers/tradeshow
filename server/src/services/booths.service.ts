import { boothSchema, type Booth, type BoothFields, type CreateBoothInput } from '@shared'
import { listAllRecords, createRecord } from '@/lib/airtable'

const TABLE = 'Booths'

export async function listBooths(baseId: string): Promise<Booth[]> {
  const records = await listAllRecords<BoothFields>(baseId, TABLE)
  return records.map((record) => boothSchema.parse(record))
}

export async function createBooth(baseId: string, input: CreateBoothInput): Promise<Booth> {
  const record = await createRecord<BoothFields>(baseId, TABLE, input)
  return boothSchema.parse(record)
}
