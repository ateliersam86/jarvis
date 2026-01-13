'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const lines = [
  { text: "$ jarvis status", color: "text-white" },
  { text: "  Gemini CLI    ● connected   (gemini-2.0-flash)", color: "text-green-400" },
  { text: "  Claude CLI    ● connected   (claude-sonnet-4)", color: "text-green-400" },
  { text: "  Codex CLI     ○ not found   (run: jarvis setup)", color: "text-yellow-400" },
  { text: "", color: "text-white" },
  { text: "$ jarvis delegate \"Refactor auth.ts\" --auto", color: "text-white" },
  { text: "  ✓ Task analyzed: Backend/Logic → Claude Sonnet", color: "text-blue-400" },
  { text: "  ✓ Delegating to claude-sonnet-4...", color: "text-blue-400" },
  { text: "  ✓ Task completed in 12.3s", color: "text-green-400" },
]

export function TerminalMockup() {
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [displayedLines, setDisplayedLines] = useState<{ text: string, color: string }[]>([])

  useEffect(() => {
    if (currentLineIndex >= lines.length) return

    const line = lines[currentLineIndex]

    // Empty lines display instantly
    if (line.text === "") {
      const timeout = setTimeout(() => {
        setDisplayedLines(prev => [...prev, line])
        setCurrentLineIndex(prev => prev + 1)
        setCurrentCharIndex(0)
      }, 100)
      return () => clearTimeout(timeout)
    }

    if (currentCharIndex < line.text.length) {
      const timeout = setTimeout(() => {
        setCurrentCharIndex(prev => prev + 1)
      }, line.text.startsWith("$") ? 50 : 20) // Slower for commands
      return () => clearTimeout(timeout)
    } else {
      const timeout = setTimeout(() => {
        setDisplayedLines(prev => [...prev, line])
        setCurrentLineIndex(prev => prev + 1)
        setCurrentCharIndex(0)
      }, line.text.startsWith("$") ? 800 : 300) // Pause after commands
      return () => clearTimeout(timeout)
    }
  }, [currentLineIndex, currentCharIndex])

  const currentLine = lines[currentLineIndex]
  const currentText = currentLine ? currentLine.text.substring(0, currentCharIndex) : ""

  return (
    <div className="w-full max-w-3xl mx-auto glass-card rounded-xl overflow-hidden font-mono text-sm md:text-base shadow-2xl shadow-black/50">
      <div className="bg-white/5 px-4 py-2 flex items-center gap-2 border-b border-white/5">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <div className="ml-2 text-xs text-muted">jarvis — zsh</div>
      </div>
      <div className="p-6 h-[320px] overflow-hidden flex flex-col justify-end bg-[#0c0c0c]/90">
        {displayedLines.map((line, i) => (
          <div key={i} className={cn("mb-1", line.color)}>{line.text || "\u00A0"}</div>
        ))}
        {currentLineIndex < lines.length && (
          <div className={cn("mb-1", currentLine.color)}>
            {currentText}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="inline-block w-2 h-4 bg-primary ml-1 align-middle"
            />
          </div>
        )}
      </div>
    </div>
  )
}
