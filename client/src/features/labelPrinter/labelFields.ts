import type { Item } from '@shared'

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
})

function formatCurrency(value: number | undefined): string | undefined {
  return value === undefined ? undefined : currencyFormatter.format(value)
}

function formatDimensions(item: Item): string | undefined {
  const { Height, Width, Depth, 'Unit of Measure': unit } = item.fields
  if (!Height && !Width) {
    return undefined
  }
  const parts = [Height ?? '?', Width ?? '?']
  if (Depth) {
    parts.push(Depth)
  }
  return `${parts.join(' × ')} ${unit ?? ''}`.trim()
}

function netPrice(item: Item): number | undefined {
  const listPrice = item.fields['List Price']
  if (listPrice === undefined) {
    return undefined
  }
  return listPrice - (item.fields.Discount ?? 0)
}

export interface LabelField {
  key: string
  label: string
  getValue: (item: Item) => string | undefined
  // Airtable's Label field is a "rich text" long text field: its value is a
  // Markdown-ish string (bold/italic/links/lists) rather than plain text.
  richText?: boolean
}

export const LABEL_FIELDS: LabelField[] = [
  {
    key: 'Title',
    label: 'Title',
    getValue: (item) => item.fields['Label Title'] || item.fields.Title,
  },
  { key: 'Label', label: 'Label', getValue: (item) => item.fields.Label, richText: true },
  { key: 'Artist', label: 'Artist', getValue: (item) => item.fields.Artist },
  { key: 'Dimensions', label: 'Dimensions', getValue: formatDimensions },
  { key: 'Condition', label: 'Condition', getValue: (item) => item.fields.Condition },
  { key: 'Location', label: 'Location', getValue: (item) => item.fields.Location },
  { key: 'Consigner', label: 'Consigner', getValue: (item) => item.fields.Consigner },
  {
    key: 'List Price',
    label: 'List Price',
    getValue: (item) => formatCurrency(item.fields['List Price']),
  },
  { key: 'Discount', label: 'Discount', getValue: (item) => formatCurrency(item.fields.Discount) },
  { key: 'Price', label: 'Price (after discount)', getValue: (item) => formatCurrency(netPrice(item)) },
  { key: 'Description', label: 'Description', getValue: (item) => item.fields.Description },
]

export const DEFAULT_FIELD_KEYS = ['Title', 'Label', 'Artist', 'Dimensions', 'Price']
