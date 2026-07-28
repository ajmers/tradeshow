import { z } from 'zod'
import { saleSchema, type Sale, type CreateSaleInput } from '@shared'
import { apiFetch } from '@/lib/apiFetch'

export async function fetchSales(): Promise<Sale[]> {
  const res = await apiFetch('/api/sales')
  if (!res.ok) {
    throw new Error(`Failed to fetch sales: ${res.status}`)
  }
  return z.array(saleSchema).parse(await res.json())
}

export async function createSale(input: CreateSaleInput): Promise<Sale> {
  const res = await apiFetch('/api/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    throw new Error(`Failed to record sale: ${res.status}`)
  }
  return saleSchema.parse(await res.json())
}
