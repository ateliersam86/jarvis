'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const lines = [
  { text: "> initializing jarvis core...", color: "text-blue-400" },
  { text: "> loading modules: [planner, executor, memory]", color: "text-green-400" },
  { text: "> establishing neural link...", color: "text-blue-400" },
  { text: "> connection secured.", color: "text-green-400" },
  { text: "> waiting for user command...", color: "text-white" },
]

export function TerminalMockup() {
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [displayedLines, setDisplayedLines] = useState<{text: string, color: string}[]>([])

  useEffect(() => {
    if (currentLineIndex >= lines.length) return

    const line = lines[currentLineIndex]
    
    if (currentCharIndex < line.text.length) {
      const timeout = setTimeout(() => {
        setCurrentCharIndex(prev => prev + 1)
      }, 30 + Math.random() * 50) // Random typing speed
      return () => clearTimeout(timeout)
    } else {
      // Line finished
      const timeout = setTimeout(() => {
        setDisplayedLines(prev => [...prev, line])
        setCurrentLineIndex(prev => prev + 1)
        setCurrentCharIndex(0)
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [currentLineIndex, currentCharIndex])

  // Current line being typed
  const currentLine = lines[currentLineIndex]
  const currentText = currentLine ? currentLine.text.substring(0, currentCharIndex) : ""

  return (
    <div className="w-full max-w-3xl mx-auto glass-card rounded-xl overflow-hidden font-mono text-sm md:text-base shadow-2xl shadow-black/50">
      <div className="bg-white/5 px-4 py-2 flex items-center gap-2 border-b border-white/5">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <div className="ml-2 text-xs text-muted">jarvis-cli — zsh</div>
      </div>
      <div className="p-6 h-[300px] overflow-hidden flex flex-col justify-end bg-[#0c0c0c]/90">
        {displayedLines.map((line, i) => (
          <div key={i} className={cn("mb-1", line.color)}>{line.text}</div>
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
