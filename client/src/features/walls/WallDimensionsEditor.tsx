import { useState } from 'react'
import type { Wall } from '@shared'
import { useUpdateWall } from '@/hooks/useWallMutations'

export function WallDimensionsEditor({ wall }: { wall: Wall }) {
  const [editing, setEditing] = useState(false)
  const updateWall = useUpdateWall()

  if (!editing) {
    return (
      <div className="wall-editor-dimensions">
        <span>
          {wall.fields.Height ?? '?'} × {wall.fields.Width ?? '?'}{' '}
          {wall.fields['Unit of Measure'] ?? 'ft'}
        </span>
        <button
          type="button"
          className="wall-editor-dimensions__edit-button"
          onClick={() => setEditing(true)}
          aria-label="Edit dimensions"
          title="Edit dimensions"
        >
          ✎
        </button>
      </div>
    )
  }

  return (
    <div className="wall-editor-dimensions wall-editor-dimensions--editing">
      <input
        type="number"
        step="any"
        min="0"
        defaultValue={wall.fields.Height ?? ''}
        aria-label="Wall height"
        autoFocus
        onBlur={(event) => {
          const raw = event.target.value.trim()
          if (raw === '') {
            event.target.value = wall.fields.Height !== undefined ? String(wall.fields.Height) : ''
            return
          }
          const value = Number(raw)
          if (Number.isNaN(value) || value === wall.fields.Height) {
            return
          }
          updateWall.mutate({ id: wall.id, input: { Height: value } })
        }}
      />
      <span>×</span>
      <input
        type="number"
        step="any"
        min="0"
        defaultValue={wall.fields.Width ?? ''}
        aria-label="Wall width"
        onBlur={(event) => {
          const raw = event.target.value.trim()
          if (raw === '') {
            event.target.value = wall.fields.Width !== undefined ? String(wall.fields.Width) : ''
            return
          }
          const value = Number(raw)
          if (Number.isNaN(value) || value === wall.fields.Width) {
            return
          }
          updateWall.mutate({ id: wall.id, input: { Width: value } })
        }}
      />
      <select
        defaultValue={wall.fields['Unit of Measure'] ?? ''}
        aria-label="Unit of measure"
        onChange={(event) => {
          const value = event.target.value
          if (!value) {
            return
          }
          updateWall.mutate({
            id: wall.id,
            input: { 'Unit of Measure': value as 'inches' | 'centimeters' | 'cm' },
          })
        }}
      >
        <option value="">ft</option>
        <option value="inches">inches</option>
        <option value="centimeters">centimeters</option>
        <option value="cm">cm</option>
      </select>
      <button type="button" onClick={() => setEditing(false)} aria-label="Done editing dimensions">
        Done
      </button>
    </div>
  )
}
