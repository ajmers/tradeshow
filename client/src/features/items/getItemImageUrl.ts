import type { Item } from '@shared'

export function getItemImageUrl(item: Item): string | undefined {
  const image = item.fields['cropped image']?.[0] ?? item.fields.Images?.[0]
  return image?.thumbnails?.large?.url ?? image?.url
}
