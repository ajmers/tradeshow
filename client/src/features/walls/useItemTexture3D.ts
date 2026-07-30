import { useEffect, useMemo, useRef } from 'react'
import useImage from 'use-image'
import * as THREE from 'three'
import type { Item } from '@shared'
import { getItemImageUrl } from '@/features/items/getItemImageUrl'

/**
 * Loads an item's photo as a Three.js texture. Returns the texture plus a ref that
 * must be attached to whichever material displays it: a material that already
 * rendered once without a texture needs an explicit `needsUpdate` nudge once the
 * texture arrives asynchronously, otherwise Three.js keeps using the shader program
 * it already compiled without a texture sampler and the photo never appears, even
 * though `map` is set correctly.
 */
export function useItemTexture3D(item: Item) {
  const imageUrl = getItemImageUrl(item)
  const [image] = useImage(imageUrl ?? '', 'anonymous')

  const texture = useMemo(() => {
    if (!image) {
      return null
    }
    const t = new THREE.Texture(image)
    t.colorSpace = THREE.SRGBColorSpace
    t.needsUpdate = true
    return t
  }, [image])

  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.needsUpdate = true
    }
  }, [texture])

  return { texture, materialRef }
}
