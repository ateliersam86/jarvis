'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Bot, Loader2, AlertCircle } from 'lucide-react'

interface ActivityItem {
  agent: string
  taskId: string
  input: string
  timestamp: string
  success: boolean
  model?: string
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch('/api/agents/status')
        if (!res.ok) throw new Error('Erreur API')

        const data = await res.json()
        if (!data?.agents || !Array.isArray(data.agents)) return

        // Extract recent tasks from all agents
        const allTasks: ActivityItem[] = []
        for (const agent of data.agents) {
          if (agent?.recentTasks && Array.isArray(agent.recentTasks)) {
            for (const task of agent.recentTasks.slice(0, 3)) {
              if (!task || !task.taskId) continue
              const inputText = task.input || ''
              allTasks.push({
                agent: agent.agentId || 'unknown',
                taskId: task.taskId,
                input: inputText.length > 50 ? inputText.slice(0, 50) + '...' : inputText,
                timestamp: task.timestamp || new Date().toISOString(),
                success: task.success !== false,
                model: task.model
              })
            }
          }
        }

        // Sort by timestamp and take top 5
        allTasks.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        setActivities(allTasks.slice(0, 5))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur')
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
    const interval = setInterval(fetchActivities, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days}j`
    if (hours > 0) return `${hours}h`
    if (minutes > 0) return `${minutes}m`
    return 'maintenant'
  }

  return (
    <div className="bg-surface/50 border border-border rounded-xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Activité Récente
        </h3>
        {activities.length > 0 && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm py-4">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && activities.length === 0 && (
        <p className="text-muted text-sm text-center py-8">
          Aucune activité récente
        </p>
      )}

      {/* Activities */}
      <div className="space-y-4">
        {activities.map((item, i) => (
          <motion.div
            key={item.taskId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-3 group"
          >
            <div className={`mt-1 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${item.success ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'
              }`}>
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-medium capitalize">{item.agent}</span>{' '}
                <span className="text-muted">{item.success ? 'a exécuté' : 'a échoué'}</span>
              </p>
              <p className="text-xs text-muted truncate">{item.input || 'Tâche sans description'}</p>
              <p className="text-xs text-muted/60 mt-0.5">{formatTime(item.timestamp)}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
