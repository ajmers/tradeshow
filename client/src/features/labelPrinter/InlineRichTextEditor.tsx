import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { htmlToMarkdown, markdownToHtml } from '@/features/labelPrinter/richTextMarkdown'

interface InlineRichTextEditorProps {
  value: string
  onSave: (value: string) => Promise<unknown>
  onCancel: () => void
}

// No visible formatting toolbar by design — this is meant to feel like
// editing plain text in a word processor, not filling out a form. The
// browser's own Cmd/Ctrl+B and Cmd/Ctrl+I shortcuts still work in a
// contentEditable region without any code here, and richTextMarkdown's
// htmlToMarkdown already knows how to save whatever <strong>/<em> that
// produces — that capability isn't gone, just not surfaced as buttons.
export function InlineRichTextEditor({ value, onSave, onCancel }: InlineRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) {
      return
    }
    editor.innerHTML = markdownToHtml(value)
    editor.focus()
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    // Only ever runs once on mount — the editor owns its own content from
    // here, re-running on `value` changes would clobber what's being typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
    if (!editorRef.current) {
      return
    }
    setSaving(true)
    try {
      await onSave(htmlToMarkdown(editorRef.current.innerHTML))
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
      return
    }
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      void handleSave()
      return
    }
    // A plain Enter still breaks the line, but as a <br> — steering every
    // browser toward the same flat structure htmlToMarkdown expects, instead
    // of some inserting a new <div>/<p> per line.
    if (event.key === 'Enter') {
      event.preventDefault()
      document.execCommand('insertLineBreak')
    }
  }

  return (
    <div className="inline-rich-editor">
      <div
        ref={editorRef}
        className="inline-rich-editor__content"
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
      />
      <div className="inline-rich-editor__actions">
        <button type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="button" onClick={() => void handleSave()} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
