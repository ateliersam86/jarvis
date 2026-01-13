'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  language?: string
  filename?: string
}

export function CodeBlock({ code, language = 'bash', filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const onCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg overflow-hidden border border-border bg-[#0c0c0c] my-4">
      {(filename || language) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
          <div className="text-xs text-muted font-mono">{filename || language}</div>
          <button
            onClick={onCopy}
            className="text-muted hover:text-foreground transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-sm text-gray-300">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}
