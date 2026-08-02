import type { Item } from '@shared'
import { LABEL_FIELDS } from '@/features/labelPrinter/labelFields'
import { bucketSizeInches, labelSizeBucketForItem } from '@/features/labelPrinter/labelBucketing'

// Horizontal gap from the item's right edge — the label's X range then never
// overlaps the item's, regardless of either one's exact size, so it starts
// already clear of the item instead of on top of it.
const GAP_INCHES = 0.5

// An on-wall label's size is "however big that item's label would actually
// print" (see bucketSizeInches/labelSizeBucketForItem in labelBucketing.ts),
// not a size invented separately for the wall view. Sizing each label purely
// from its own title/price text (an earlier approach) produced wildly
// inconsistent results: a short-titled label next to a full-size painting
// looked tiny, a long title made an oversized label next to a small item, and
// two items of the exact same physical size could get very differently sized
// labels purely because their titles differ in length -- none of which has
// any real relationship to the item or the wall.
export function labelSizeInches(item: Item): { width: number; height: number } {
  return bucketSizeInches(labelSizeBucketForItem(item))
}

const TITLE_FIELD = LABEL_FIELDS.find((field) => field.key === 'Title')
const PRICE_FIELD = LABEL_FIELDS.find((field) => field.key === 'Price')

export interface LabelLine {
  text: string
  /** Rendered larger/bolder/serif, matching the printed label's title field. */
  isTitle?: boolean
}

/** The on-wall label's content: just title + net price (not the full print field set). */
export function labelLinesForItem(item: Item): LabelLine[] {
  const lines: LabelLine[] = []
  const title = TITLE_FIELD?.getValue(item)
  if (title) {
    lines.push({ text: title, isTitle: true })
  }
  const price = PRICE_FIELD?.getValue(item)
  if (price) {
    lines.push({ text: price })
  }
  return lines
}

/**
 * Where a newly-placed item's label starts before the user ever drags it: to the
 * right of the item, with its bottom edge on the same baseline as the item's, so
 * it never overlaps the item.
 */
export function defaultLabelPosition(
  itemXInches: number,
  itemYInches: number,
  itemFootprint: { width: number; height: number },
  labelHeightInches: number,
): { x: number; y: number } {
  return {
    x: itemXInches + itemFootprint.width + GAP_INCHES,
    y: itemYInches + itemFootprint.height - labelHeightInches,
  }
}
