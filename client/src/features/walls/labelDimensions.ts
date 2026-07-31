// Estimates the physical size (in inches) a printed label would take up, purely
// from its text content — a prototype for sizing/placing a draggable label
// representation on the wall canvas the same way itemFootprintInches() sizes an
// item from its own physical dimensions.
//
// Uses an offscreen <canvas> 2D context, the standard browser-accurate way to
// measure how wide a string actually renders in a given font (accounts for
// real glyph metrics, unlike guessing from character count).

// Matches the print label's own font sizes, which the print stylesheet already
// ties to real point sizes (see .label-sheet__field / .label-sheet__field--Title
// in index.css) — so an on-wall label estimates the same footprint it would
// actually have once printed.
// Exported so LabelNode's actual rendered text can match exactly what was
// measured here — any drift between the two would make the label's drawn
// content not fit the box it was sized for.
export const TITLE_FONT_PX = 21.33 // 16pt
export const FIELD_FONT_PX = 18.67 // 14pt
export const TITLE_FONT_FAMILY = "'Libertinus Serif', Georgia, serif"
export const FIELD_FONT_FAMILY = "'Source Sans 3', system-ui, sans-serif"
export const LINE_HEIGHT_RATIO = 1.3
// Roughly matches .label-sheet__label's own padding (1.25rem margin at 16px root).
export const PADDING_INCHES = 0.2

// The CSS-spec-standard reference pixel browsers use consistently for absolute
// units (in/pt) in both screen and print media — same conversion used for the
// "print as wide as the page" wall-canvas scaling.
export const PX_PER_INCH = 96

// Clamped so one very long field (e.g. a long description) doesn't make the
// label absurdly wide — it wraps to more lines (taller) instead, the way real
// label stock has a fixed width and variable height.
const MIN_WIDTH_INCHES = 1.5
const MAX_WIDTH_INCHES = 4

export interface LabelLine {
  text: string
  /** Rendered larger/bolder/serif, matching the printed label's title field. */
  isTitle?: boolean
}

export interface LabelDimensions {
  widthInches: number
  heightInches: number
}

let measureCanvas: HTMLCanvasElement | null = null

function getMeasureContext(): CanvasRenderingContext2D {
  measureCanvas ??= document.createElement('canvas')
  const ctx = measureCanvas.getContext('2d')
  if (!ctx) {
    throw new Error('2D canvas context unavailable')
  }
  return ctx
}

function fontFor(line: LabelLine): string {
  const family = line.isTitle ? TITLE_FONT_FAMILY : FIELD_FONT_FAMILY
  const sizePx = line.isTitle ? TITLE_FONT_PX : FIELD_FONT_PX
  return `${line.isTitle ? '600 ' : ''}${sizePx}px ${family}`
}

// Greedy word-wrap: how many lines `text` breaks into at maxWidthPx. Mirrors
// how a real (CSS white-space: normal) text block wraps, just counting lines
// instead of laying out the actual glyphs.
function wrappedLineCount(ctx: CanvasRenderingContext2D, text: string, maxWidthPx: number): number {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return 0
  }
  let lineCount = 1
  let currentWidthPx = 0
  for (const word of words) {
    const wordWidthPx = ctx.measureText(`${word} `).width
    if (currentWidthPx > 0 && currentWidthPx + wordWidthPx > maxWidthPx) {
      lineCount += 1
      currentWidthPx = wordWidthPx
    } else {
      currentWidthPx += wordWidthPx
    }
  }
  return lineCount
}

export function measureLabelDimensions(lines: LabelLine[]): LabelDimensions {
  const nonEmptyLines = lines.filter((line) => line.text.trim().length > 0)
  if (nonEmptyLines.length === 0) {
    return { widthInches: MIN_WIDTH_INCHES, heightInches: PADDING_INCHES * 2 }
  }

  const ctx = getMeasureContext()

  let naturalWidthPx = 0
  for (const line of nonEmptyLines) {
    ctx.font = fontFor(line)
    naturalWidthPx = Math.max(naturalWidthPx, ctx.measureText(line.text).width)
  }

  const widthPx = Math.min(
    Math.max(naturalWidthPx, MIN_WIDTH_INCHES * PX_PER_INCH),
    MAX_WIDTH_INCHES * PX_PER_INCH,
  )

  let heightPx = 0
  for (const line of nonEmptyLines) {
    ctx.font = fontFor(line)
    const wrapped = wrappedLineCount(ctx, line.text, widthPx)
    heightPx += wrapped * (line.isTitle ? TITLE_FONT_PX : FIELD_FONT_PX) * LINE_HEIGHT_RATIO
  }

  return {
    widthInches: widthPx / PX_PER_INCH + PADDING_INCHES * 2,
    heightInches: heightPx / PX_PER_INCH + PADDING_INCHES * 2,
  }
}
