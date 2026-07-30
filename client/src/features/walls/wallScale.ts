const INCHES_PER_CM = 0.393701
const INCHES_PER_FOOT = 12

/** Fallback footprint for items with no Height/Width set, so placement math always has something to work with. */
export const DEFAULT_ITEM_INCHES = 6

/** For item dimensions, which default to inches when no unit is set. */
export function toInches(value: number, unit: string | undefined): number {
  if (unit === 'centimeters' || unit === 'cm') {
    return value * INCHES_PER_CM
  }
  return value
}

/** For wall dimensions, which default to feet when no unit is set. */
export function wallDimensionToInches(value: number, unit: string | undefined): number {
  if (unit === 'centimeters' || unit === 'cm') {
    return value * INCHES_PER_CM
  }
  if (unit === 'inches') {
    return value
  }
  return value * INCHES_PER_FOOT
}

/** An item's on-wall footprint in inches, falling back to a default when unset. */
export function itemFootprintInches(fields: {
  Width?: number
  Height?: number
  'Unit of Measure'?: string
}): { width: number; height: number } {
  return {
    width: fields.Width ? toInches(fields.Width, fields['Unit of Measure']) : DEFAULT_ITEM_INCHES,
    height: fields.Height ? toInches(fields.Height, fields['Unit of Measure']) : DEFAULT_ITEM_INCHES,
  }
}

/**
 * An item's freestanding footprint in inches, for floor placement. Unlike wall
 * items (where a missing Depth legitimately means "flat"), a floor item always
 * occupies real floor space, so Depth falls back to the same default as Width/Height
 * rather than to zero.
 */
export function itemFloorFootprintInches(fields: {
  Width?: number
  Height?: number
  Depth?: number
  'Unit of Measure'?: string
}): { width: number; height: number; depth: number } {
  return {
    ...itemFootprintInches(fields),
    depth: fields.Depth ? toInches(fields.Depth, fields['Unit of Measure']) : DEFAULT_ITEM_INCHES,
  }
}
