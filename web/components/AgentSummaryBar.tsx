'use client';

import { motion } from 'framer-motion';
import { Cpu, CheckCircle2, XCircle, AlertTriangle, Activity, Zap, BrainCircuit, Info } from 'lucide-react';

interface WorkerData {
    workerId: string;
    projectId?: string;
    uniqueId?: string;
    status: string;
    modelId: string;
    successRate: number;
    recentTasks?: { model?: string; timestamp?: string }[];
}

export default function AgentSummaryBar({ workers }: { workers: WorkerData[] }) {
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'online': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'busy': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
            case 'error': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'online': return CheckCircle2;
            case 'busy': return Activity;
            case 'error': return XCircle;
            default: return AlertTriangle;
        }
    };

    const getModelInfo = (worker: WorkerData) => {
        // Get the latest model usage from recent tasks, fallback to static modelId
        const lastTask = worker.recentTasks && worker.recentTasks.length > 0
            ? worker.recentTasks[0] // Assuming index 0 is newest. If not, we'd sort.
            : null;

        const activeModel = lastTask?.model || worker.modelId;
        const isPro = activeModel.toLowerCase().includes('pro');

        return {
            name: activeModel,
            isPro,
            color: isPro ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
            icon: isPro ? BrainCircuit : Zap,
            reasoning: isPro
                ? "Complexity: High • Reasoning Required"
                : "Complexity: Low • Optimization: Speed"
        };
    };

    if (!workers || workers.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {workers.map((worker, index) => {
                const StatusIcon = getStatusIcon(worker.status);
                const statusStyles = getStatusColor(worker.status);
                const modelInfo = getModelInfo(worker);
                const ModelIcon = modelInfo.icon;

                return (
                    <motion.div
                        key={worker.uniqueId || worker.workerId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex flex-col justify-between p-4 rounded-xl border backdrop-blur-sm ${statusStyles} h-32 relative group overflow-hidden`}
                    >
                        {/* Heartbeat pulse for busy agents */}
                        {worker.status.toLowerCase() === 'busy' && (
                            <motion.div 
                                className="absolute inset-0 bg-yellow-500/5 pointer-events-none"
                                animate={{ opacity: [0, 0.2, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />
                        )}

                        {/* Header: Identity & Status */}
                        <div className="flex items-start justify-between mb-2 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                    <Cpu className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold uppercase tracking-wider text-xs opacity-90">
                                            {worker.workerId}
                                        </span>
                                        {worker.projectId && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/20 font-mono opacity-75">
                                                {worker.projectId}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <StatusIcon className={`w-3 h-3 ${worker.status.toLowerCase() === 'online' ? 'animate-pulse' : ''}`} />
                                        <span className="text-[10px] font-bold uppercase opacity-80">{worker.status}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer: Dynamic Model Badge */}
                        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between relative z-10">
                            <div className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${modelInfo.color}`}>
                                <ModelIcon className="w-3 h-3" />
                                <span className="truncate max-w-[120px]">{modelInfo.name}</span>
                            </div>

                            {/* Reasoning Tooltip Trigger */}
                            <div className="relative group/tooltip">
                                <Info className="w-3 h-3 opacity-40 hover:opacity-100 cursor-help transition-opacity" />
                                <div className="absolute right-0 bottom-full mb-2 w-48 p-2 bg-slate-900 border border-white/10 rounded-lg shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                                    <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">Selection Logic</div>
                                    <div className="text-[10px] text-slate-200 leading-tight">
                                        {modelInfo.reasoning}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
