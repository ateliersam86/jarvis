'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CopyInstallButton() {
    const [copied, setCopied] = useState(false)
    const command = "npm install -g @jarvis/cli"

    const handleCopy = async () => {
        await navigator.clipboard.writeText(command)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <motion.button
            onClick={handleCopy}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/15 hover:border-primary/50 rounded-xl px-5 py-3.5 transition-all duration-300"
        >
            <div className="flex items-center gap-3 font-mono text-sm text-gray-300">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="opacity-50 select-none">$</span>
                <span className="group-hover:text-white transition-colors">{command}</span>
            </div>

            <div className={cn(
                "ml-4 pl-4 border-l border-white/10 h-6 flex items-center",
                copied ? "text-green-400" : "text-gray-400 group-hover:text-white"
            )}>
                <AnimatePresence mode='wait'>
                    {copied ? (
                        <motion.div
                            key="check"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                        >
                            <Check className="w-4 h-4" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="copy"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                        >
                            <Copy className="w-4 h-4" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Glow Effect */}
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/20 to-blue-500/20 opacity-0 group-hover:opacity-100 blur transition-opacity duration-500 -z-10" />
        </motion.button>
    )
}
