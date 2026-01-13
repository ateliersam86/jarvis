'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CLIAgent {
    id: string;
    name: string;
    status: 'connected' | 'not_authenticated' | 'not_found';
    model: string;
    icon: string;
}

const statusConfig = {
    connected: {
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/20',
        dot: '●',
        label: 'connected'
    },
    not_authenticated: {
        color: 'text-amber-400',
        bg: 'bg-amber-500/20',
        dot: '●',
        label: 'not authenticated'
    },
    not_found: {
        color: 'text-red-400',
        bg: 'bg-red-500/20',
        dot: '○',
        label: 'not found'
    }
};

export function CLIStatus() {
    const [agents, setAgents] = useState<CLIAgent[]>([
        { id: 'gemini', name: 'Gemini CLI', status: 'not_found', model: 'unknown', icon: '🔷' },
        { id: 'claude', name: 'Claude CLI', status: 'not_found', model: 'unknown', icon: '🟣' },
        { id: 'openai', name: 'Codex CLI', status: 'not_found', model: 'unknown', icon: '🔶' }
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch('/api/v1/cli/status');
                if (response.ok) {
                    const data = await response.json();
                    setAgents(data.agents || []);
                }
            } catch (error) {
                console.error('Failed to fetch CLI status:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        // Poll every 30 seconds
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    🤖 CLI Agents
                </h3>
                {loading && (
                    <span className="text-xs text-white/40 animate-pulse">Checking...</span>
                )}
            </div>

            <div className="space-y-3">
                {agents.map((agent, index) => {
                    const config = statusConfig[agent.status];
                    return (
                        <motion.div
                            key={agent.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center justify-between p-3 rounded-xl ${config.bg} border border-white/5`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{agent.icon}</span>
                                <div>
                                    <p className="text-sm font-medium text-white">{agent.name}</p>
                                    <p className="text-xs text-white/50">{agent.model}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-lg ${config.color}`}>{config.dot}</span>
                                <span className={`text-xs ${config.color}`}>{config.label}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <p className="text-xs text-white/30 mt-4 text-center">
                Run <code className="text-cyan-400">jarvis --status</code> in terminal
            </p>
        </motion.div>
    );
}
