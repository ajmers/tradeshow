// A deliberately small, best-effort Markdown <-> HTML bridge for the inline
// WYSIWYG label editor (InlineRichTextEditor). It only understands what that
// editor's own toolbar can produce — **bold**, *italic*, "- " bullet lines,
// and line breaks — so it never invents formatting the user didn't ask for.
// Anything else already in the stored Markdown (headings, links, code,
// ordered lists, ...) is preserved as literal text rather than interpreted
// or stripped, so opening and closing the editor without touching
// unsupported syntax can't corrupt it — it just won't render richly until
// someone edits it using the toolbar.

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inlineMarkdownToHtml(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.split('\n')
  const htmlParts: string[] = []
  let listBuffer: string[] = []

  function flushList() {
    if (listBuffer.length === 0) {
      return
    }
    htmlParts.push(`<ul>${listBuffer.map((item) => `<li>${inlineMarkdownToHtml(item)}</li>`).join('')}</ul>`)
    listBuffer = []
  }

  for (const line of lines) {
    const bulletMatch = /^\s*[-*]\s+(.*)$/.exec(line)
    if (bulletMatch) {
      listBuffer.push(bulletMatch[1] ?? '')
      continue
    }
    flushList()
    htmlParts.push(inlineMarkdownToHtml(line))
    htmlParts.push('<br>')
  }
  flushList()
  if (htmlParts[htmlParts.length - 1] === '<br>') {
    htmlParts.pop()
  }
  return htmlParts.join('') || '<br>'
}

function inlineNodeToMarkdown(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ''
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return ''
  }
  const element = node as HTMLElement
  const tag = element.tagName.toLowerCase()
  const inner = Array.from(element.childNodes).map(inlineNodeToMarkdown).join('')
  if (tag === 'strong' || tag === 'b') {
    return `**${inner}**`
  }
  if (tag === 'em' || tag === 'i') {
    return `*${inner}*`
  }
  if (tag === 'br') {
    return '\n'
  }
  // Browsers commonly wrap wrapped/typed lines in <div>/<p> on Enter even
  // when we try to steer them toward plain <br>s — treat both as a line break
  // after their own content so text doesn't run together.
  if (tag === 'div' || tag === 'p') {
    return `${inner}\n`
  }
  return inner
}

export function htmlToMarkdown(html: string): string {
  const container = document.createElement('div')
  container.innerHTML = html

  const lines: string[] = []
  for (const node of Array.from(container.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName.toLowerCase() === 'ul') {
      for (const item of Array.from((node as HTMLElement).children)) {
        lines.push(`- ${Array.from(item.childNodes).map(inlineNodeToMarkdown).join('')}\n`)
      }
      continue
    }
    lines.push(inlineNodeToMarkdown(node))
  }

  return lines
    .join('')
    .replace(/\u00A0/g, ' ') // contentEditable often inserts &nbsp; in place of trailing/leading spaces
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
