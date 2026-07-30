import { useEffect, useMemo, useRef } from 'react'
import useImage from 'use-image'
import * as THREE from 'three'
import type { Item } from '@shared'
import { getItemImageUrl } from '@/features/items/getItemImageUrl'

/**
 * Loads an item's photo as a Three.js texture. Returns the texture plus refs that
 * must be attached to whichever materials display it: a material that already
 * rendered once without a texture needs an explicit `needsUpdate` nudge once the
 * texture arrives asynchronously, otherwise Three.js keeps using the shader program
 * it already compiled without a texture sampler and the photo never appears, even
 * though `map`/`alphaMap` is set correctly.
 *
 * `backMaterialRef` is for a 3D item's back face, which reuses this same texture as
 * an `alphaMap` (not `map`) so it stays a plain color but is cut out to match the
 * front photo's silhouette — otherwise a transparent part of the photo just reveals
 * the item's own opaque back face sitting right behind it, instead of letting you
 * see through the item entirely.
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
  const backMaterialRef = useRef<THREE.MeshBasicMaterial>(null)
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.needsUpdate = true
    }
    if (backMaterialRef.current) {
      backMaterialRef.current.needsUpdate = true
    }
  }, [texture])

  return { texture, materialRef, backMaterialRef }
}
