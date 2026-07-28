import { saleSchema, type Sale, type SaleFields, type CreateSaleInput } from '@shared'
import { listAllRecords, createRecord } from '@/lib/airtable'

const TABLE = 'Sales'

export async function listSales(baseId: string): Promise<Sale[]> {
  const records = await listAllRecords<SaleFields>(baseId, TABLE)
  return records.map((record) => saleSchema.parse(record))
}

export async function createSale(baseId: string, input: CreateSaleInput): Promise<Sale> {
  const record = await createRecord<SaleFields>(baseId, TABLE, input)
  return saleSchema.parse(record)
}
