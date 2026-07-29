import type { Item } from '@shared'
import type { LabelField } from '@/features/labelPrinter/labelFields'

export type LabelSizeBucket = 'large' | 'medium' | 'small'

export const BUCKET_LABELS_PER_PAGE: Record<LabelSizeBucket, number> = {
  large: 2,
  medium: 4,
  small: 8,
}

export const BUCKET_TITLES: Record<LabelSizeBucket, string> = {
  large: 'Large labels (2 per page)',
  medium: 'Medium labels (4 per page)',
  small: 'Small labels (8 per page)',
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

// Fixed word-count cutoffs rather than ranking items into thirds — a rank-based
// split would put items in the "large" bucket just because there weren't enough
// longer items to fill it, even if those items had little or no text at all.
const SMALL_MAX_WORDS = 50
const MEDIUM_MAX_WORDS = 90

function classify(words: number): LabelSizeBucket {
  if (words <= SMALL_MAX_WORDS) {
    return 'small'
  }
  if (words <= MEDIUM_MAX_WORDS) {
    return 'medium'
  }
  return 'large'
}

export interface BucketedItems {
  bucket: LabelSizeBucket
  items: Item[]
}

/** Splits items into size buckets by total label word count against fixed thresholds. */
export function bucketItemsByWordCount(items: Item[], fields: LabelField[]): BucketedItems[] {
  const buckets: Record<LabelSizeBucket, Item[]> = { large: [], medium: [], small: [] }
  for (const item of items) {
    buckets[classify(wordCount(item, fields))].push(item)
  }

  return (['large', 'medium', 'small'] as const)
    .map((bucket) => ({ bucket, items: buckets[bucket] }))
    .filter((group) => group.items.length > 0)
}
