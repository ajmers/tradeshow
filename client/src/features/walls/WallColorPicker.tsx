import type { Wall } from '@shared'
import { useUpdateWall } from '@/hooks/useWallMutations'

const DEFAULT_COLOR = '#e4e4e7'

interface WallColorPickerProps {
  wall: Wall
  boothWalls: Wall[]
}

export function WallColorPicker({ wall, boothWalls }: WallColorPickerProps) {
  const updateWall = useUpdateWall()
  const currentColor = wall.fields['Wall Color']?.trim() || DEFAULT_COLOR

  // Distinct colors already used by other walls in this booth, offered as quick-pick
  // swatches so a booth's walls can stay visually consistent without re-entering hex codes.
  const otherColors = Array.from(
    new Set(
      boothWalls
        .filter((entry) => entry.id !== wall.id)
        .map((entry) => entry.fields['Wall Color']?.trim())
        .filter((color): color is string => Boolean(color) && color !== currentColor),
    ),
  )

  const handleColorChange = (color: string) => {
    updateWall.mutate({ id: wall.id, input: { 'Wall Color': color } })
  }

  const handleApplyToAll = () => {
    boothWalls
      .filter((entry) => (entry.fields['Wall Color']?.trim() || DEFAULT_COLOR) !== currentColor)
      .forEach((entry) => updateWall.mutate({ id: entry.id, input: { 'Wall Color': currentColor } }))
  }

  return (
    <div className="wall-editor-color-picker">
      <label>
        Wall color
        <input
          type="color"
          value={currentColor}
          onChange={(event) => handleColorChange(event.target.value)}
        />
      </label>

      {otherColors.length > 0 && (
        <div className="wall-editor-color-picker__swatches">
          {otherColors.map((color) => (
            <button
              key={color}
              type="button"
              className="wall-editor-color-picker__swatch"
              style={{ backgroundColor: color }}
              title={color}
              aria-label={`Use color ${color}`}
              onClick={() => handleColorChange(color)}
            />
          ))}
        </div>
      )}

      {boothWalls.length > 1 && (
        <button
          type="button"
          className="wall-editor-color-picker__apply-all"
          onClick={handleApplyToAll}
          disabled={updateWall.isPending}
        >
          Apply to all walls in booth
        </button>
      )}
    </div>
  )
}
