interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface OccupiedItem {
  x: number
  y: number
  width: number
  height: number
  rotationDegrees: number
}

// Extra breathing room kept between the new item and its neighbors, in inches.
const PADDING_INCHES = 2
// Grid resolution for the free-space search, in inches — fine enough to find real gaps
// without being so fine it's slow on a large wall.
const STEP_INCHES = 1

function rotatedBoundingBox(width: number, height: number, rotationDegrees: number): Rect {
  const radians = (rotationDegrees * Math.PI) / 180
  const aabbWidth = Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians))
  const aabbHeight = Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians))
  return { x: 0, y: 0, width: aabbWidth, height: aabbHeight }
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

/**
 * Scans the wall (top-left to bottom-right) for the first spot big enough to fit a new
 * item's unrotated footprint without overlapping any existing item's actual (rotated)
 * footprint. Returns the top-left corner in inches, or null if nothing fits.
 */
export function findEmptySpot(
  wallWidthInches: number,
  wallHeightInches: number,
  newItemWidthInches: number,
  newItemHeightInches: number,
  existingItems: OccupiedItem[],
): { x: number; y: number } | null {
  const maxX = wallWidthInches - newItemWidthInches
  const maxY = wallHeightInches - newItemHeightInches
  if (maxX < 0 || maxY < 0) {
    return null
  }

  const occupiedRects: Rect[] = existingItems.map((existing) => {
    const centerX = existing.x + existing.width / 2
    const centerY = existing.y + existing.height / 2
    const aabb = rotatedBoundingBox(existing.width, existing.height, existing.rotationDegrees)
    return {
      x: centerX - aabb.width / 2,
      y: centerY - aabb.height / 2,
      width: aabb.width,
      height: aabb.height,
    }
  })

  for (let y = 0; y <= maxY; y += STEP_INCHES) {
    for (let x = 0; x <= maxX; x += STEP_INCHES) {
      const candidate: Rect = {
        x: x - PADDING_INCHES,
        y: y - PADDING_INCHES,
        width: newItemWidthInches + PADDING_INCHES * 2,
        height: newItemHeightInches + PADDING_INCHES * 2,
      }
      if (!occupiedRects.some((rect) => rectsOverlap(candidate, rect))) {
        return { x, y }
      }
    }
  }

  return null
}
