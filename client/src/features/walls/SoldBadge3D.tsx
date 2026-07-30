import { Text } from '@react-three/drei'

interface SoldBadge3DProps {
  position: [number, number, number]
  rotation: [number, number, number]
  width: number
  height: number
}

// Matches the 2D canvas's red "SOLD" badge (PlacedItemNode), just rendered as a
// small plane + drei Text instead of Konva shapes.
export function SoldBadge3D({ position, rotation, width, height }: SoldBadge3DProps) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#dc2626" toneMapped={false} />
      </mesh>
      <Text
        position={[0, 0, 0.001]}
        fontSize={height * 0.55}
        color="#ffffff"
        fontWeight="bold"
        anchorX="center"
        anchorY="middle"
      >
        SOLD
      </Text>
    </group>
  )
}
