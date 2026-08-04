import type { Item } from '@shared'
import { LABEL_FIELDS, DEFAULT_FIELD_KEYS, type LabelField } from '@/features/labelPrinter/labelFields'
import { PAGE_LAYOUTS } from '@/features/labelPrinter/labelPrinterConfig'

export type LabelSizeBucket = 'full' | 'large' | 'medium' | 'small'

export const BUCKET_LABELS_PER_PAGE: Record<LabelSizeBucket, number> = {
  full: 1,
  large: 2,
  medium: 4,
  small: 8,
}

export const BUCKET_TITLES: Record<LabelSizeBucket, string> = {
  full: 'Full-page labels (1 per page)',
  large: 'Large labels (2 per page)',
  medium: 'Medium labels (4 per page)',
  small: 'Small labels (8 per page)',
}

// The New Label dialog's "Label Size" field lets a user pin an item to one of
// these instead of it being auto-classified below — this maps that field's
// stored option name to the internal bucket key it corresponds to.
export const EXPLICIT_LABEL_SIZE_TO_BUCKET: Record<string, LabelSizeBucket> = {
  Small: 'small',
  Medium: 'medium',
  Large: 'large',
  'Full-page': 'full',
}

function wordCount(item: Item, fields: LabelField[]): number {
  return fields.reduce((sum, field) => {
    const value = field.getValue(item)
    if (!value) {
      return sum
    }
    return sum + value.trim().split(/\s+/).filter(Boolean).length
  }, 0)
}

// Fixed word-count cutoffs rather than ranking items into groups — a rank-based
// split would put items in a bigger bucket just because there weren't enough
// longer items to fill it, even if those items had little or no text at all.
// Tuned against the smallest container each bucket can render into (default field
// set, logo shown — the default config, and the tightest case since the logo eats
// space no word count accounts for), so a default-config label never overflows.
const SMALL_MAX_WORDS = 16
const MEDIUM_MAX_WORDS = 55
const LARGE_MAX_WORDS = 120

function classifyByWordCount(words: number): LabelSizeBucket {
  if (words <= SMALL_MAX_WORDS) {
    return 'small'
  }
  if (words <= MEDIUM_MAX_WORDS) {
    return 'medium'
  }
  if (words <= LARGE_MAX_WORDS) {
    return 'large'
  }
  return 'full'
}

/**
 * An item's label size bucket: whatever size it's explicitly pinned to via its
 * own "Label Size" field, or one auto-classified from its label content's word
 * count if it hasn't been pinned.
 */
export function labelSizeBucket(item: Item, fields: LabelField[]): LabelSizeBucket {
  const explicit = item.fields['Label Size']
  const explicitBucket = explicit ? EXPLICIT_LABEL_SIZE_TO_BUCKET[explicit] : undefined
  return explicitBucket ?? classifyByWordCount(wordCount(item, fields))
}

// The label's full default field set (Title/Label/Artist/Dimensions/Price) —
// used as the word-count basis for every caller that isn't the print sheet
// itself (which classifies against whatever fields that view currently has
// configured to show). An item's bucket should be a stable property of the
// item, not something that shifts based on a particular view's display
// choices, so callers like the wall canvas and the New Label preview classify
// against this fixed set rather than any one view's current selection.
const DEFAULT_FIELDS = LABEL_FIELDS.filter((field) => DEFAULT_FIELD_KEYS.includes(field.key))

export function labelSizeBucketForItem(item: Item): LabelSizeBucket {
  return labelSizeBucket(item, DEFAULT_FIELDS)
}

// Matches .label-sheet__page's own printed dimensions (index.css) — a bucket's
// physical size is "however big that many labels dividing an actual printed
// page would be," not a size invented separately per caller.
export const PAGE_WIDTH_INCHES = 7.2
export const PAGE_HEIGHT_INCHES = 9.7

export function bucketSizeInches(bucket: LabelSizeBucket): { width: number; height: number } {
  const labelsPerPage = BUCKET_LABELS_PER_PAGE[bucket]
  const layout = PAGE_LAYOUTS[labelsPerPage] ?? { columns: 2, rows: 4 }
  return {
    width: PAGE_WIDTH_INCHES / layout.columns,
    height: PAGE_HEIGHT_INCHES / layout.rows,
  }
}

export interface BucketedItems {
  bucket: LabelSizeBucket
  items: Item[]
}

/** Splits items into size buckets — see labelSizeBucket() for how each item's bucket is chosen. */
export function bucketItemsByLabelSize(items: Item[], fields: LabelField[]): BucketedItems[] {
  const buckets: Record<LabelSizeBucket, Item[]> = { full: [], large: [], medium: [], small: [] }
  for (const item of items) {
    buckets[labelSizeBucket(item, fields)].push(item)
  }

  return (['full', 'large', 'medium', 'small'] as const)
    .map((bucket) => ({ bucket, items: buckets[bucket] }))
    .filter((group) => group.items.length > 0)
}
