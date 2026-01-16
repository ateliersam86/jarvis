'use client'

import { motion } from 'framer-motion'
import { Zap, FolderOpen, CheckCircle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface StatsData {
  activeAgents: number
  totalProjects: number
  totalTasks: number
}

export function Stats() {
  const [data, setData] = useState<StatsData>({ activeAgents: 0, totalProjects: 0, totalTasks: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch projects
        let totalProjects = 0
        let totalTasks = 0
        try {
          const projectsRes = await fetch('/api/v1/projects')
          if (projectsRes.ok) {
            const json = await projectsRes.json()
            const projects = json?.projects || []
            totalProjects = projects.length
            totalTasks = projects.reduce((acc: number, p: { _count?: { tasks: number }, taskCount?: number }) =>
              acc + (p?._count?.tasks || p?.taskCount || 0), 0)
          }
        } catch { /* ignore */ }

        // Fetch agents
        let activeAgents = 0
        try {
          const agentsRes = await fetch('/api/agents/status')
          if (agentsRes.ok) {
            const agentsData = await agentsRes.json()
            activeAgents = agentsData?.agents?.length || 0
          }
        } catch { /* ignore */ }

        setData({ activeAgents, totalProjects, totalTasks })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const stats = [
    { label: 'Agents Actifs', value: data.activeAgents, icon: Zap, color: 'text-yellow-400' },
    { label: 'Projets', value: data.totalProjects, icon: FolderOpen, color: 'text-blue-400' },
    { label: 'Tâches', value: data.totalTasks, icon: CheckCircle, color: 'text-emerald-400' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
            {loading && (
              <Loader2 className="w-4 h-4 animate-spin text-muted" />
            )}
          </div>
          <p className="text-muted text-sm font-medium mb-1">{stat.label}</p>
          <h3 className="text-3xl font-bold text-foreground">
            {stat.value}
          </h3>
        </motion.div>
      ))}
    </div>
  )
}
