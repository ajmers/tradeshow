import { env } from '@/lib/env'

const AIRTABLE_API_URL = 'https://api.airtable.com/v0'
// The attachment upload endpoint lives on a different host than the rest of the API.
const AIRTABLE_CONTENT_API_URL = 'https://content.airtable.com/v0'

export interface AirtableRecord<Fields> {
  id: string
  createdTime: string
  fields: Fields
}

interface AirtableListResponse<Fields> {
  records: Array<AirtableRecord<Fields>>
  offset?: string
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.AIRTABLE_PAT}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!res.ok) {
    throw new Error(`Airtable request failed (${res.status}): ${await res.text()}`)
  }

  return res.json() as Promise<T>
}

async function airtableFetch<T>(baseId: string, path: string, init?: RequestInit): Promise<T> {
  return request<T>(`${AIRTABLE_API_URL}/${baseId}${path}`, init)
}

export async function listAllRecords<Fields>(
  baseId: string,
  table: string,
): Promise<Array<AirtableRecord<Fields>>> {
  const records: Array<AirtableRecord<Fields>> = []
  let offset: string | undefined

  do {
    const params = new URLSearchParams()
    if (offset) {
      params.set('offset', offset)
    }
    const page = await airtableFetch<AirtableListResponse<Fields>>(
      baseId,
      `/${encodeURIComponent(table)}?${params.toString()}`,
    )
    records.push(...page.records)
    offset = page.offset
  } while (offset)

  return records
}

export async function getRecord<Fields>(
  baseId: string,
  table: string,
  id: string,
): Promise<AirtableRecord<Fields>> {
  return airtableFetch<AirtableRecord<Fields>>(baseId, `/${encodeURIComponent(table)}/${id}`)
}

export async function createRecord<Fields>(
  baseId: string,
  table: string,
  fields: Partial<Fields>,
): Promise<AirtableRecord<Fields>> {
  return airtableFetch<AirtableRecord<Fields>>(baseId, `/${encodeURIComponent(table)}`, {
    method: 'POST',
    body: JSON.stringify({ fields }),
  })
}

export async function updateRecord<Fields>(
  baseId: string,
  table: string,
  id: string,
  fields: Partial<Fields>,
): Promise<AirtableRecord<Fields>> {
  return airtableFetch<AirtableRecord<Fields>>(baseId, `/${encodeURIComponent(table)}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  })
}

export async function deleteRecord(baseId: string, table: string, id: string): Promise<void> {
  await airtableFetch<{ id: string; deleted: boolean }>(baseId, `/${encodeURIComponent(table)}/${id}`, {
    method: 'DELETE',
  })
}

export interface AirtableBaseSummary {
  id: string
  name: string
  permissionLevel: string
}

// Unlike the rest of this client, base listing isn't scoped to a single base
// (it's how you discover which bases a token can see in the first place).
export async function listBases(): Promise<AirtableBaseSummary[]> {
  const bases: AirtableBaseSummary[] = []
  let offset: string | undefined

  do {
    const params = new URLSearchParams()
    if (offset) {
      params.set('offset', offset)
    }
    const page = await request<{ bases: AirtableBaseSummary[]; offset?: string }>(
      `${AIRTABLE_API_URL}/meta/bases?${params.toString()}`,
    )
    bases.push(...page.bases)
    offset = page.offset
  } while (offset)

  return bases
}

export interface AirtableAttachmentUpload {
  contentType: string
  file: string
  filename: string
}

/**
 * Uploads a single attachment to an existing record's field. Note: unlike every other
 * endpoint here, Airtable's response for this call keys `fields` by field ID rather than
 * field name, so callers should re-fetch the record via `getRecord` afterward rather than
 * trusting this response shape.
 */
export async function uploadAttachment(
  baseId: string,
  recordId: string,
  fieldName: string,
  attachment: AirtableAttachmentUpload,
): Promise<void> {
  await request(
    `${AIRTABLE_CONTENT_API_URL}/${baseId}/${recordId}/${encodeURIComponent(fieldName)}/uploadAttachment`,
    {
      method: 'POST',
      body: JSON.stringify(attachment),
    },
  )
}
