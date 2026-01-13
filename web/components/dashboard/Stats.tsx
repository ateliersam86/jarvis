'use client'

import { motion } from 'framer-motion'
import { Zap, FolderOpen, CheckCircle, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const AnimatedCounter = ({ value, suffix = '' }: { value: number, suffix?: string }) => {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let start = 0
    const end = value
    const duration = 1000
    const increment = end / (duration / 16)
    
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    
    return () => clearInterval(timer)
  }, [value])

  return <span>{count}{suffix}</span>
}

export function Stats() {
  const stats = [
    { label: 'Active Agents', value: 12, icon: Zap, color: 'text-yellow-400', trend: '+2', trendUp: true },
    { label: 'Total Projects', value: 5, icon: FolderOpen, color: 'text-blue-400', trend: '0', trendUp: null },
    { label: 'Tasks Completed', value: 128, icon: CheckCircle, color: 'text-emerald-400', trend: '+12%', trendUp: true },
    { label: 'Quota Usage', value: 45, suffix: '%', icon: Activity, color: 'text-purple-400', trend: '-5%', trendUp: false },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-surface/50 border border-border rounded-xl p-6 hover:border-primary/20 transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 bg-surface rounded-lg group-hover:scale-110 transition-transform ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            {stat.trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                stat.trendUp === true ? "text-emerald-400 bg-emerald-400/10" :
                stat.trendUp === false ? "text-red-400 bg-red-400/10" :
                "text-muted bg-white/5"
              )}>
                {stat.trendUp === true && <TrendingUp className="w-3 h-3" />}
                {stat.trendUp === false && <TrendingDown className="w-3 h-3" />}
                {stat.trendUp === null && <Minus className="w-3 h-3" />}
                {stat.trend}
              </div>
            )}
          </div>
          <p className="text-muted text-sm font-medium mb-1">{stat.label}</p>
          <h3 className="text-3xl font-bold text-foreground">
            <AnimatedCounter value={stat.value} suffix={stat.suffix} />
          </h3>
        </motion.div>
      ))}
    </div>
  )
}

