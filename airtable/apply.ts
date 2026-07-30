// Generic runner for the declarative migration files in airtable/migrations/.
// Airtable has no SQL/DDL layer to run migrations against — this is the closest
// equivalent: each migration is a JSON file describing fields/tables to add, and
// this script applies whichever ones aren't already applied (checked by name, so
// it's safe to re-run). Add a new migration by dropping in the next-numbered file;
// this script never needs to change.
//
// Usage (from the repo root):
//   AIRTABLE_PAT=your_pat npx tsx airtable/apply.ts <baseId>
//
// The PAT needs schema read/write scope for the target base. Find the base ID in
// its API docs page (airtable.com/api) or its URL — it starts with "app".

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'migrations')

const baseId = process.argv[2]
const pat = process.env.AIRTABLE_PAT

if (!baseId) {
  console.error('Usage: npx tsx airtable/apply.ts <baseId>')
  process.exit(1)
}
if (!pat) {
  console.error('Set AIRTABLE_PAT in the environment first.')
  process.exit(1)
}

interface AirtableField {
  id: string
  name: string
  type: string
}
interface AirtableTable {
  id: string
  name: string
  fields: AirtableField[]
}

interface FieldSpec {
  table: string
  name: string
  type: string
  options?: Record<string, unknown>
}
interface TableFieldSpec {
  name: string
  type: string
  options?: Record<string, unknown>
  /** Name of another table in this base to link to — resolved to its id at apply time. */
  linkedTable?: string
}
interface TableSpec {
  name: string
  description?: string
  fields: TableFieldSpec[]
}
interface MigrationSpec {
  description: string
  fields?: FieldSpec[]
  tables?: TableSpec[]
}

async function airtableRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${pat}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} failed (${res.status}): ${JSON.stringify(json)}`)
  }
  return json as T
}

async function getTables(): Promise<AirtableTable[]> {
  const { tables } = await airtableRequest<{ tables: AirtableTable[] }>('/tables')
  return tables
}

async function ensureField(tables: AirtableTable[], spec: FieldSpec) {
  const table = tables.find((t) => t.name === spec.table)
  if (!table) {
    throw new Error(`No "${spec.table}" table found in this base.`)
  }
  if (table.fields.some((f) => f.name === spec.name)) {
    console.log(`  – ${spec.table}.${spec.name} already exists, skipping`)
    return
  }
  await airtableRequest(`/tables/${table.id}/fields`, {
    method: 'POST',
    body: JSON.stringify({ name: spec.name, type: spec.type, options: spec.options }),
  })
  console.log(`  + created ${spec.table}.${spec.name}`)
}

async function ensureTable(tables: AirtableTable[], spec: TableSpec) {
  if (tables.some((t) => t.name === spec.name)) {
    console.log(`  – table "${spec.name}" already exists, skipping`)
    return
  }
  const fields = spec.fields.map((field) => {
    if (!field.linkedTable) {
      return { name: field.name, type: field.type, options: field.options }
    }
    const linked = tables.find((t) => t.name === field.linkedTable)
    if (!linked) {
      throw new Error(
        `No "${field.linkedTable}" table found in this base (needed by "${spec.name}.${field.name}").`,
      )
    }
    return {
      name: field.name,
      type: field.type,
      options: { ...field.options, linkedTableId: linked.id },
    }
  })
  await airtableRequest('/tables', {
    method: 'POST',
    body: JSON.stringify({ name: spec.name, description: spec.description, fields }),
  })
  console.log(`  + created table "${spec.name}"`)
}

async function main() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
  console.log(`Applying ${files.length} migration(s) to base ${baseId}...`)

  for (const file of files) {
    const spec: MigrationSpec = JSON.parse(readFileSync(join(MIGRATIONS_DIR, file), 'utf-8'))
    console.log(`\n${file}: ${spec.description}`)
    // Re-fetched each migration so a table a later migration links to (or a field it
    // checks for) reflects what an earlier migration in this same run just created.
    const tables = await getTables()
    for (const field of spec.fields ?? []) {
      await ensureField(tables, field)
    }
    for (const table of spec.tables ?? []) {
      await ensureTable(tables, table)
    }
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
