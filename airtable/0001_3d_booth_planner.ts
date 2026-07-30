// Adds the Airtable schema the 3D Booth Planner needs: booth footprint/height on
// Booths, which of a booth's 4 vertical surfaces a Wall occupies, and a new table
// for items placed freestanding on the floor (not attached to any wall).
//
// Airtable has no migration runner, so this just calls the Meta API directly and
// skips anything that already exists — safe to re-run if it's interrupted partway.
//
// Usage (from the repo root):
//   AIRTABLE_PAT=your_pat npx tsx airtable/0001_3d_booth_planner.ts <baseId>
//
// The PAT needs schema read/write scope for the target base. Find the base ID in
// its API docs page (airtable.com/api) or its URL — it starts with "app".

const baseId = process.argv[2]
const pat = process.env.AIRTABLE_PAT

if (!baseId) {
  console.error('Usage: npx tsx airtable/0001_3d_booth_planner.ts <baseId>')
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

async function ensureField(table: AirtableTable, field: Record<string, unknown>) {
  const name = field.name as string
  if (table.fields.some((f) => f.name === name)) {
    console.log(`  – ${table.name}.${name} already exists, skipping`)
    return
  }
  await airtableRequest(`/tables/${table.id}/fields`, {
    method: 'POST',
    body: JSON.stringify(field),
  })
  console.log(`  + created ${table.name}.${name}`)
}

async function main() {
  console.log(`Applying 3D Booth Planner schema to base ${baseId}...`)
  const tables = await getTables()

  const booths = tables.find((t) => t.name === 'Booths')
  const walls = tables.find((t) => t.name === 'Walls')
  const items = tables.find((t) => t.name === 'Items')
  if (!booths) throw new Error('No "Booths" table found in this base.')
  if (!walls) throw new Error('No "Walls" table found in this base.')
  if (!items) throw new Error('No "Items" table found in this base.')

  console.log('Booths: footprint + height (feet)')
  await ensureField(booths, { name: 'Booth Width', type: 'number', options: { precision: 1 } })
  await ensureField(booths, { name: 'Booth Depth', type: 'number', options: { precision: 1 } })
  await ensureField(booths, { name: 'Booth Height', type: 'number', options: { precision: 1 } })

  console.log('Walls: which booth surface a wall occupies')
  await ensureField(walls, {
    name: 'Booth Surface',
    type: 'singleSelect',
    options: { choices: [{ name: 'Front' }, { name: 'Back' }, { name: 'Left' }, { name: 'Right' }] },
  })

  console.log('Floor Placements: freestanding items not attached to a wall')
  if (tables.some((t) => t.name === 'Floor Placements')) {
    console.log('  – table already exists, skipping')
  } else {
    await airtableRequest('/tables', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Floor Placements',
        description:
          'Items placed freestanding on a booth floor in the 3D layout, not attached to any wall.',
        fields: [
          { name: 'Placement', type: 'singleLineText' },
          { name: 'Item', type: 'multipleRecordLinks', options: { linkedTableId: items.id } },
          { name: 'Booth', type: 'multipleRecordLinks', options: { linkedTableId: booths.id } },
          { name: 'X Position', type: 'number', options: { precision: 1 } },
          { name: 'Y Position', type: 'number', options: { precision: 1 } },
          { name: 'Rotation Angle', type: 'number', options: { precision: 1 } },
        ],
      }),
    })
    console.log('  + created table')
  }

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
