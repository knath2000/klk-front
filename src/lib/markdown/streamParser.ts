export type MdBlock =
  | { type: 'code'; language?: string; code: string; complete: boolean }
  | { type: 'text'; text: string }

/**
 * splitMarkdownStreaming
 * Splits a markdown input into an ordered array of blocks suitable for streaming rendering:
 * - text blocks (markdown content)
 * - code blocks (with language, content, and whether the fence was closed)
 *
 * This is intentionally small and dependency-free so it can run on frequent re-renders while streaming.
 */
export function splitMarkdownStreaming(input: string): MdBlock[] {
  if (!input) return []

  // Normalize line endings for predictable parsing
  const lines = input.replace(/\r\n/g, '\n').split('\n')
  const blocks: MdBlock[] = []
  let i = 0
  let buffer: string[] = []

  while (i < lines.length) {
    const line = lines[i]
    const fenceMatch = line.match(/^```(\w+)?\s*$/)
    if (!fenceMatch) {
      buffer.push(line)
      i++
      continue
    }

    // flush text buffer before starting a code fence
    if (buffer.length) {
      blocks.push({ type: 'text', text: buffer.join('\n') })
      buffer = []
    }

    const lang = fenceMatch[1]
    i++
    const codeLines: string[] = []
    let closed = false

    while (i < lines.length) {
      const cur = lines[i]
      if (/^```\s*$/.test(cur)) {
        closed = true
        i++
        break
      }
      codeLines.push(cur)
      i++
    }

    blocks.push({ type: 'code', language: lang, code: codeLines.join('\n'), complete: closed })
  }

  if (buffer.length) {
    blocks.push({ type: 'text', text: buffer.join('\n') })
  }

  return blocks
}