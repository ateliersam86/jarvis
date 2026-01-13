'use client'

import { motion } from 'framer-motion'
import { Activity, Bot, User, GitCommit } from 'lucide-react'

export function ActivityFeed() {
  const activities = [
    { user: 'Jarvis Bot', action: 'completed task', target: 'Refactor UI', time: '2m ago', icon: Bot, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { user: 'Samuel', action: 'deployed project', target: 'Atelier Web', time: '1h ago', icon: User, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { user: 'System', action: 'auto-scaled workers', target: 'Cluster A', time: '3h ago', icon: Activity, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { user: 'Git', action: 'pushed commit', target: 'feat: glassmorphism', time: '4h ago', icon: GitCommit, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  ]

  return (
    <div className="bg-surface/50 border border-border rounded-xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Live Activity
        </h3>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>

      <div className="space-y-6">
        {activities.map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-4 group"
          >
            <div className={`mt-1 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
              <item.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-medium">{item.user}</span>{' '}
                <span className="text-muted">{item.action}</span>{' '}
                <span className="font-medium text-primary">{item.target}</span>
              </p>
              <p className="text-xs text-muted mt-0.5">{item.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
