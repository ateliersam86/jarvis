'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, Clock, RefreshCw } from 'lucide-react';

interface AgentUsageStat {
    id: string;
    name: string;
    role: string;
    color: string;
    totalTokens: number;
    totalCost: number;
    limit: number;
    percentUsed: number;
    resetTime: string;
    lastUpdated: string;
}

export default function QuotaMonitor() {
    const [stats, setStats] = useState<AgentUsageStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/agents/usage');
            const data = await res.json();
            if (data.stats) {
                setStats(data.stats);
            }
            setLastRefresh(new Date());
        } catch (error) {
            console.error('Failed to fetch quota stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (percent: number) => {
        if (percent >= 90) return 'text-red-500 bg-red-500/10 border-red-500/20';
        if (percent >= 50) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    };

    const getBarColor = (percent: number) => {
        if (percent >= 90) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
        if (percent >= 50) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    return (
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Quota Monitoring
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Daily Token Limits & Usage</p>
                </div>
                <div className="flex items-center gap-2">
                    {loading && <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
                    <span className="text-[9px] font-mono text-slate-600 uppercase">
                        Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                {stats.map((agent) => {
                    const statusStyles = getStatusColor(agent.percentUsed);
                    const barColor = getBarColor(agent.percentUsed);
                    const isCritical = agent.percentUsed >= 90;

                    return (
                        <div key={agent.id} className="relative group">
                            <div className="flex justify-between items-end mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${agent.percentUsed >= 90 ? 'bg-red-500 animate-pulse' : agent.percentUsed >= 50 ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                                    <span className="text-xs font-bold text-slate-200 capitalize">{agent.name}</span>
                                    <span className="text-[9px] text-slate-500 uppercase font-medium">{agent.role}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-mono text-slate-400">
                                        {agent.totalTokens.toLocaleString()} / {agent.limit >= 1000000 ? `${(agent.limit/1000000).toFixed(1)}M` : `${(agent.limit/1000).toFixed(0)}k`}
                                    </span>
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusStyles}`}>
                                        {Math.round(agent.percentUsed)}%
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${agent.percentUsed}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className={`h-full ${barColor}`}
                                />
                            </div>

                            <div className="flex justify-between mt-1.5 px-0.5">
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase font-mono">
                                    <Clock className="w-3 h-3" />
                                    Reset in {agent.resetTime}
                                </div>
                                {isCritical && (
                                    <div className="flex items-center gap-1 text-[9px] text-red-400 font-bold uppercase animate-pulse">
                                        <AlertTriangle className="w-3 h-3" />
                                        Critical Limit Reached
                                    </div>
                                )}
                            </div>

                            {/* Background Glow for Critical Agents */}
                            {isCritical && (
                                <div className="absolute -inset-2 bg-red-500/5 blur-xl rounded-full -z-10 pointer-events-none" />
                            )}
                        </div>
                    );
                })}

                {stats.length === 0 && !loading && (
                    <div className="text-center py-8 border-2 border-dashed border-white/5 rounded-xl">
                        <p className="text-xs text-slate-600 italic">No agent usage data available</p>
                    </div>
                )}
            </div>

            {/* Footer Legend */}
            <div className="mt-8 pt-4 border-t border-white/5 grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center">
                    <div className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Optimal</div>
                    <div className="h-1 w-full bg-emerald-500/30 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-emerald-500" />
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <div className="text-[10px] font-bold text-yellow-500 uppercase mb-1">Warning</div>
                    <div className="h-1 w-full bg-yellow-500/30 rounded-full overflow-hidden">
                        <div className="h-full w-2/3 bg-yellow-500" />
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <div className="text-[10px] font-bold text-red-500 uppercase mb-1">Critical</div>
                    <div className="h-1 w-full bg-red-500/30 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-red-500" />
                    </div>
                </div>
            </div>
        </div>
    );
}
