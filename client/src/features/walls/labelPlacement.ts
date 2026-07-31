import type { Item } from '@shared'
import { LABEL_FIELDS, DEFAULT_FIELD_KEYS } from '@/features/labelPrinter/labelFields'
import { PAGE_LAYOUTS } from '@/features/labelPrinter/labelPrinterConfig'
import { BUCKET_LABELS_PER_PAGE, labelSizeBucket } from '@/features/labelPrinter/labelBucketing'

// Diagonal offset from the item's bottom-right corner, in both axes — the label's
// X range alone then never overlaps the item's, regardless of either one's exact
// size, so it starts already clear of the item instead of on top of it.
const GAP_INCHES = 0.5

// Matches .label-sheet__page's own printed dimensions (index.css) — an on-wall
// label's size is "however big that item's label would actually print", not a
// size invented separately for the wall view. Sizing each label purely from its
// own title/price text (an earlier approach) produced wildly inconsistent
// results: a short-titled label next to a full-size painting looked tiny, a
// long title made an oversized label next to a small item, and two items of
// the exact same physical size could get very differently sized labels purely
// because their titles differ in length -- none of which has any real
// relationship to the item or the wall. Reusing the print sheet's own
// small/medium/large/full-page buckets (each a fixed fraction of a real
// printed page, auto-chosen from the item's overall label content length, or
// pinned explicitly via the item's own Label Size field) gives every label a
// real, predictable, physically-accurate size instead.
const PAGE_WIDTH_INCHES = 7.2
const PAGE_HEIGHT_INCHES = 9.7

// The word-count classification looks at the label's full default field set
// (Title/Label/Artist/Dimensions/Price) — the same basis the print sheet uses
// by default — even though the on-wall label itself only ever shows title +
// price (see labelLinesForItem below). The bucket describes "how much this
// item's label has to say," not just what the wall happens to display of it.
const DEFAULT_FIELDS = LABEL_FIELDS.filter((field) => DEFAULT_FIELD_KEYS.includes(field.key))

export function labelSizeInches(item: Item): { width: number; height: number } {
  const bucket = labelSizeBucket(item, DEFAULT_FIELDS)
  const labelsPerPage = BUCKET_LABELS_PER_PAGE[bucket]
  const layout = PAGE_LAYOUTS[labelsPerPage] ?? { columns: 2, rows: 4 }
  return {
    width: PAGE_WIDTH_INCHES / layout.columns,
    height: PAGE_HEIGHT_INCHES / layout.rows,
  }
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
 * Where a newly-placed item's label starts before the user ever drags it: offset
 * diagonally from the item's bottom-right corner, so it never overlaps the item.
 */
export function defaultLabelPosition(
  itemXInches: number,
  itemYInches: number,
  itemFootprint: { width: number; height: number },
): { x: number; y: number } {
  return {
    x: itemXInches + itemFootprint.width + GAP_INCHES,
    y: itemYInches + itemFootprint.height + GAP_INCHES,
  }
}
