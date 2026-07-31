import type { Item } from '@shared'
import { LABEL_FIELDS } from '@/features/labelPrinter/labelFields'
import {
  measureLabelDimensions,
  type LabelLine,
  type LabelDimensions,
} from '@/features/walls/labelDimensions'

// Diagonal offset from the item's bottom-right corner, in both axes — the label's
// X range alone then never overlaps the item's, regardless of either one's exact
// size, so it starts already clear of the item instead of on top of it.
const GAP_INCHES = 0.5

const TITLE_FIELD = LABEL_FIELDS.find((field) => field.key === 'Title')
const PRICE_FIELD = LABEL_FIELDS.find((field) => field.key === 'Price')

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

export function labelDimensionsForItem(item: Item): LabelDimensions {
  return measureLabelDimensions(labelLinesForItem(item))
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
