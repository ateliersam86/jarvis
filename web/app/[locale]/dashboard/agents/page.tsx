'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, Zap, RefreshCw, AlertTriangle, WifiOff, ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Link } from '@/i18n/routing'

interface AgentStatus {
  id: string
  name: string
  status: 'online' | 'offline' | 'busy'
  model: string
  projectId?: string
  lastActive?: string
  totalTasks?: number
  successRate?: number
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/agents/status')
      if (!res.ok) {
        throw new Error(`Erreur API: ${res.status} ${res.statusText}`)
      }
      const data = await res.json()

      if (!data?.agents || !Array.isArray(data.agents)) {
        throw new Error('Format de réponse invalide')
      }

      // Map API response - NO FALLBACKS
      const mapped: AgentStatus[] = data.agents.map((a: any) => ({
        id: a.agentId || a.id,
        name: a.agentId?.charAt(0).toUpperCase() + a.agentId?.slice(1) || 'Agent',
        status: a.isActive ? 'online' : 'offline',
        model: a.model || 'Non détecté',
        projectId: a.projectId,
        lastActive: a.lastActive,
        totalTasks: a.stats?.totalTasks,
        successRate: a.stats?.successRate
      }))

      setAgents(mapped)
      setLastUpdate(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de connexion aux agents')
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-8 space-y-8 min-h-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <Cpu className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
            <p className="text-muted-foreground">Statut de connexion des agents CLI</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/10 p-6">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <h3 className="font-bold text-red-400">Erreur de connexion</h3>
              <p className="text-sm text-red-300/80">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {loading && agents.length === 0 && !error && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Empty State - No agents detected */}
      {!loading && !error && agents.length === 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/10 p-8 text-center">
          <WifiOff className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="font-bold text-yellow-400 text-xl mb-2">Aucun agent détecté</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Aucun agent CLI n'a été utilisé récemment.
            Lancez une tâche avec <code className="bg-white/10 px-2 py-1 rounded">node scripts/masterscript.mjs</code> pour activer les agents.
          </p>
        </Card>
      )}

      {/* Agent Cards */}
      {agents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="relative overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl p-6 h-full hover:border-blue-500/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Zap className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${agent.status === 'online' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                    agent.status === 'busy' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                    {agent.status === 'online' ? 'ACTIF' : agent.status === 'busy' ? 'OCCUPÉ' : 'INACTIF'}
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-1">{agent.name}</h3>
                <p className="text-sm text-muted-foreground font-mono mb-4">{agent.model}</p>

                <div className="space-y-2 pt-4 border-t border-white/5">
                  {agent.projectId && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Projet</span>
                      <span className="font-mono text-blue-400">{agent.projectId}</span>
                    </div>
                  )}
                  {agent.totalTasks !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tâches exécutées</span>
                      <span className="font-mono">{agent.totalTasks}</span>
                    </div>
                  )}
                  {agent.lastActive && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Dernière activité</span>
                      <span className="font-mono text-xs">
                        {new Date(agent.lastActive).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Last Update */}
      {lastUpdate && (
        <p className="text-xs text-muted-foreground text-center">
          Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
        </p>
      )}
    </div>
  )
}
