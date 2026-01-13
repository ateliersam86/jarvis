'use client';

import { useState, useEffect } from 'react';
import { Activity, Cpu, Zap } from 'lucide-react';

type Log = {
    source: string;
    type: string;
    payload: unknown;
    timestamp: number;
};

type UsageStat = {
    name: string;
    totalTokens: number;
    limit: number;
};

type AgentStatus = 'ONLINE' | 'BUSY' | 'OFFLINE';

export default function SwarmGrid({ logs, usageStats = [] }: { logs: Log[], usageStats?: UsageStat[], onSelect?: (agent: string) => void }) {
    const agents = ['GEMINI', 'CLAUDE', 'CHATGPT'];
    const [now, setNow] = useState(0);

    useEffect(() => {
        // Delay initial update to avoid synchronous setState warning
        const timer = setTimeout(() => setNow(Date.now()), 0);
        const interval = setInterval(() => setNow(Date.now()), 10000);
        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, []);

    // Helper to filter logs for a specific agent (excluding heartbeats for visual clarity)
    const getAgentLogs = (agent: string) => logs.filter(l => l.source === agent && l.type !== 'HEARTBEAT').slice(0, 10);

    // Helper to determine status
    const getStatus = (agent: string): AgentStatus => {
        const lastLog = logs.find(l => l.source === agent);
        if (!lastLog) return 'OFFLINE';

        // Real Fix: Calculate time diff, but allow for negative diffs (clock skew).
        // If diff is > 60s AND diff < -60s (future), then offline.
        const diff = now - lastLog.timestamp;
        if (Math.abs(diff) > 120000) return 'OFFLINE'; // 2 min grace period

        if (lastLog.payload?.toString().includes('Thinking') || lastLog.payload?.toString().includes('Starting')) return 'BUSY';
        return 'ONLINE';
    }

    const colorMap: Record<string, string> = {
        'GEMINI': 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
        'CLAUDE': 'text-violet-400 border-violet-500/30 bg-violet-500/5',
        'CHATGPT': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
    };

    return (
        <div className="flex flex-col gap-4 h-full overflow-y-auto pr-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Active Swarm Nodes
            </h3>

            {agents.map(agent => {
                const status = getStatus(agent);
                const agentLogs = getAgentLogs(agent);
                const styles = colorMap[agent] || 'text-slate-400 border-slate-700 bg-slate-800/50';

                return (
                    <div key={agent} className={`border rounded-lg p-3 ${styles} transition-all duration-300`}>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4 opacity-70" />
                                <span className="font-bold font-mono text-sm">{agent}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${status === 'ONLINE' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                    status === 'BUSY' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse' :
                                        'bg-red-500/20 text-red-500 border-red-500/30'
                                    }`}>
                                    {status}
                                </span>
                            </div>
                        </div>

                        {/* Mini Terminal View */}
                        <div className="bg-black/80 rounded border border-black/50 p-2 h-24 overflow-hidden relative font-mono text-[10px] text-slate-300">
                            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                            <div className="flex flex-col justify-end h-full">
                                {agentLogs.length === 0 && <span className="opacity-30 italic">No activity...</span>}
                                {agentLogs.map((log, i) => (
                                    <div key={i} className="truncate opacity-80 border-b border-white/5 pb-0.5 mb-0.5">
                                        <span className="opacity-50 mr-1">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                        {typeof log.payload === 'string' ? log.payload : JSON.stringify(log.payload)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quota Visualization */}
                        {(() => {
                            // Find stats for this agent
                            const stat = usageStats.find(s => s.name.toUpperCase() === agent.toUpperCase());
                            const used = stat ? Math.round(stat.totalTokens) : 0;
                            const limit = stat ? stat.limit : 100000; // Default if not found
                            const percent = Math.min((used / limit) * 100, 100);

                            // Format compact numbers (e.g. 1.2M)
                            const format = (n: number | undefined) => {
                                if (!n) return '0';
                                if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
                                if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
                                return n.toString();
                            };

                            return (
                                <div className="mt-2 flex items-center gap-2 text-[10px] opacity-70">
                                    <Zap className="w-3 h-3 text-yellow-500" />
                                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-current w-full transition-all duration-500"
                                            style={{ width: `${percent}%`, backgroundColor: stat ? 'currentColor' : '' }} />
                                    </div>
                                    <span>{format(used)} / {format(limit)}</span>
                                </div>
                            );
                        })()}
                    </div>
                );
            })}
        </div>
    );
}
