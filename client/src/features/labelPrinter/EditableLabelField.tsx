import type { FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'
import type { Item } from '@shared'
import type { LabelField } from '@/features/labelPrinter/labelFields'
import { InlineRichTextEditor } from '@/features/labelPrinter/InlineRichTextEditor'
import { useUpdateItem } from '@/hooks/useItemMutations'

interface EditableLabelFieldProps {
  item: Item
  field: LabelField
  value: string
  isEditing: boolean
  onStartEdit: () => void
  onStopEdit: () => void
  /** Shown (muted, in place of the field) when value is empty — mainly for the
   *  New Label preview, where Label commonly starts blank right after creation. */
  placeholder?: string
}

// Pencil-icon-triggered inline editing for a single label field. Title edits
// write to Label Title specifically (never the item's real Title), so
// quick-editing a label can't rename it everywhere else in the app.
export function EditableLabelField({
  item,
  field,
  value,
  isEditing,
  onStartEdit,
  onStopEdit,
  placeholder,
}: EditableLabelFieldProps) {
  const updateItem = useUpdateItem()

  const className = field.richText
    ? `label-sheet__field label-sheet__field--${field.key} label-sheet__field--richtext`
    : `label-sheet__field label-sheet__field--${field.key}`

  async function saveTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const newValue = new FormData(event.currentTarget).get('title')
    await updateItem.mutateAsync({
      id: item.id,
      input: { 'Label Title': typeof newValue === 'string' ? newValue : '' },
    })
    onStopEdit()
  }

  async function saveLabel(markdown: string) {
    await updateItem.mutateAsync({ id: item.id, input: { Label: markdown } })
    onStopEdit()
  }

  if (isEditing && field.richText) {
    return (
      <div className={className}>
        <InlineRichTextEditor value={value} onSave={saveLabel} onCancel={onStopEdit} />
      </div>
    )
  }

  if (isEditing) {
    return (
      <form className="label-sheet__field-edit" onSubmit={(event) => void saveTitle(event)}>
        <input
          name="title"
          defaultValue={value}
          autoFocus
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onStopEdit()
            }
          }}
        />
        <button type="button" onClick={onStopEdit} disabled={updateItem.isPending}>
          Cancel
        </button>
        <button type="submit" disabled={updateItem.isPending}>
          {updateItem.isPending ? 'Saving…' : 'Save'}
        </button>
      </form>
    )
  }

  return (
    <div className="label-sheet__field-display">
      {value ? (
        field.richText ? (
          <div className={className}>
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{value}</ReactMarkdown>
          </div>
        ) : (
          <p className={className}>{value}</p>
        )
      ) : (
        <p className={`${className} label-sheet__field--placeholder`}>{placeholder ?? ' '}</p>
      )}
      <button
        type="button"
        className="label-sheet__edit-button"
        onClick={onStartEdit}
        aria-label={`Edit ${field.label}`}
        title={`Edit ${field.label}`}
      >
        ✎
      </button>
    </div>
  )
}
