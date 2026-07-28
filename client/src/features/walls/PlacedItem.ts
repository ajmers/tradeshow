import type { Item, WallAssignment } from '@shared'

export interface PlacedItem {
  assignment: WallAssignment
  item: Item
  isSold: boolean
}
