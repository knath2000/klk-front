'use client'

import React, { useMemo, useState } from 'react'
import clsx from 'clsx'

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

// Lightweight fallback renderer: preserves expand/collapse and copy but avoids prism/react-renderer
export default function CodeBlock({ code, language = 'tsx', className }: CodeBlockProps) {
  const [expanded, setExpanded] = useState(false)
  const lines = useMemo(() => code.split('\n'), [code])
  const canCollapse = lines.length > 24

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
    } catch (e) {
      // ignore copy failure for now
    }
  }

  return (
    <div className={clsx('relative my-3 rounded-lg border border-gray-200 dark:border-gray-700 group', className)}>
      <div className="absolute right-2 top-2 flex gap-2 z-10">
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code"
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition px-2 py-1 rounded bg-black/60 text-white text-xs"
        >
          Copy
        </button>

        {canCollapse && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            aria-label={expanded ? 'Collapse code' : 'Expand code'}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition px-2 py-1 rounded bg-black/60 text-white text-xs"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>

      <div className={expanded ? 'max-h-[60vh] overflow-auto' : 'max-h-60 overflow-auto'}>
        <pre
          className="text-sm m-0 p-3 rounded-b-lg bg-[#0b1220] text-gray-100 whitespace-pre-wrap break-words font-mono"
          tabIndex={0}
          role="region"
          aria-label={`Code snippet${language ? ` (${language})` : ''}`}
        >
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}