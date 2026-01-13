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
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group relative flex items-center gap-4 bg-gradient-to-br from-gray-900/90 to-gray-950/90 backdrop-blur-xl border border-white/10 hover:border-primary/40 rounded-2xl px-6 py-4 shadow-2xl shadow-primary/5 transition-all duration-500"
        >
            {/* Terminal Icon Container */}
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
                <Terminal className="w-5 h-5 text-primary" />
            </div>

            {/* Command Text */}
            <div className="flex flex-col items-start">
                <span className="text-xs text-gray-500 font-medium mb-0.5">Installation</span>
                <code className="font-mono text-base text-gray-200 group-hover:text-white transition-colors">
                    <span className="text-primary/70">$</span> {command}
                </code>
            </div>

            {/* Copy Button */}
            <div className={cn(
                "ml-4 flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
                copied
                    ? "bg-green-500/20 border border-green-500/30"
                    : "bg-white/5 border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/30"
            )}>
                <AnimatePresence mode='wait'>
                    {copied ? (
                        <motion.div
                            key="check"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="text-green-400"
                        >
                            <Check className="w-5 h-5" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="copy"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="text-gray-400 group-hover:text-primary"
                        >
                            <Copy className="w-5 h-5" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Glow Effect */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 via-blue-500/20 to-purple-500/30 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700 -z-10" />

            {/* Inner glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.button>
    )
}
