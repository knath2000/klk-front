'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from './CodeBlock'

type MdBlock =
  | { type: 'code'; language?: string; code: string; complete: boolean }
  | { type: 'text'; text: string }

/**
 * Split streaming markdown into blocks of text and fenced code.
 * Keeps incomplete fences as non-highlighted <pre> until the closing fence arrives.
 */
function splitMarkdownStreaming(input: string): MdBlock[] {
  const lines = input.split('\n')
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

    // flush text buffer
    if (buffer.length) {
      blocks.push({ type: 'text', text: buffer.join('\n') })
      buffer = []
    }

    const lang = fenceMatch[1]
    i++
    const codeLines: string[] = []
    let closed = false

    while (i < lines.length) {
      if (lines[i].match(/^```\s*$/)) {
        closed = true
        i++
        break
      }
      codeLines.push(lines[i])
      i++
    }

    blocks.push({ type: 'code', language: lang, code: codeLines.join('\n'), complete: closed })
  }

  if (buffer.length) blocks.push({ type: 'text', text: buffer.join('\n') })
  return blocks
}

interface StreamMarkdownProps {
  text: string
  // optional: limit render length for safety
  maxLength?: number
}

/**
 * StreamMarkdown: safe, streaming-friendly markdown renderer.
 * - Renders text via react-markdown (remark-gfm)
 * - Renders complete fenced code blocks with CodeBlock (syntax highlighting)
 * - Renders incomplete fences as plain <pre> to avoid flicker
 */
export default function StreamMarkdown({ text, maxLength }: StreamMarkdownProps) {
  const input = typeof maxLength === 'number' && text.length > maxLength ? text.slice(0, maxLength) : text
  const blocks = splitMarkdownStreaming(input)

  return (
    <article className="prose prose-stone dark:prose-invert max-w-none" aria-live="polite">
      {blocks.map((b, idx) => {
        if (b.type === 'text') {
          return (
            <div key={idx} className="mb-2">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />
                }}
              >
                {b.text || ''}
              </ReactMarkdown>
            </div>
          )
        }

        // code block
        if (b.type === 'code') {
          if (b.complete) {
            return (
              <div key={idx} className="mb-2">
                <CodeBlock code={b.code} language={b.language} />
              </div>
            )
          }

          // incomplete fence: plain pre (no highlighting) to avoid flicker
          return (
            <pre key={idx} className="my-3 rounded-lg bg-gray-900 text-gray-100 p-3 overflow-auto">
              <code>{b.code}</code>
            </pre>
          )
        }
      })}
    </article>
  )
}