const INCHES_PER_CM = 0.393701
const INCHES_PER_FOOT = 12

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
