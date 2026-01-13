'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Brain,
    Activity,
    Cpu,
    Clock,
    AlertTriangle,
    BarChart3,
    Layers,
    ListTodo,
    ListTree
} from 'lucide-react';
import dynamic from 'next/dynamic';
import AgentSummaryBar from './AgentSummaryBar';
import ProjectGrid from './ProjectGrid';
const InteractiveTerminal = dynamic(() => import('./InteractiveTerminal'), { ssr: false });
import ProjectSwitcher from './ProjectSwitcher';
import ContextTasks from './context/ContextTasks';
import { ProjectsResponse } from '@/lib/types';
import AnimatedConnection from './AnimatedConnection';

// --- Helper Components ---

function StatCard({ label, value, subValue, icon: Icon, colorClass }: { label: string, value: string | number, subValue?: string, icon: React.ComponentType<{ className?: string }>, colorClass: string }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between backdrop-blur-sm hover:bg-white/10 transition-colors relative overflow-hidden group">
            <div className="flex items-center justify-between mb-2 relative z-10">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</span>
                <Icon className={`w-4 h-4 ${colorClass}`} />
            </div>
            <div className="relative z-10">
                <div className="text-2xl font-mono font-bold text-slate-100">{value}</div>
                {subValue && <div className="text-xs text-slate-500 mt-1">{subValue}</div>}
            </div>

            {/* Subtle background pulse */}
            <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${colorClass.replace('text-', 'from-')}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                animate={{
                    opacity: [0.05, 0.1, 0.05]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />
        </div>
    );
}

// --- Main Component ---

export default function DashboardClient() {
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'performance' | 'terminal'>('overview');
    const [data, setData] = useState<ProjectsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [termContainer, setTermContainer] = useState<string>('local');

    // Heartbeat refs for connections
    const brainRef = useRef<HTMLDivElement>(null);
    const statsRef = useRef<HTMLDivElement>(null);
    const projectsRef = useRef<HTMLDivElement>(null);

    // Fetch Data
    const fetchData = async () => {
        try {
            const res = await fetch('/api/v1/projects');
            const json = await res.json();
            
            // Map projects to match Project interface requirements for grid
            const mappedProjects = (json.projects || []).map((p: any) => ({
                ...p,
                icon: p.icon || '📦',
                status: p.status || 'idle',
                activeAgents: p.activeAgents || 0,
                agentCount: p.agentCount || 0
            }));

            // Ensure projects is always an array
            setData({
                projects: mappedProjects,
                allWorkers: json.allWorkers || []
            });
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    // Global Stats
    const globalStats = useMemo(() => {
        // Fixed 3 agents as per requirements
        const activeAgents = 3; 
        
        // Calculate total tasks from projects
        const totalTasks = data?.projects?.reduce((acc, p) => acc + (p.taskCount || 0), 0) || 0;
        
        // Mock values for others as we don't have worker data from this endpoint yet
        const avgResponse = 0; 
        const totalErrors = 0;

        return { activeAgents, avgResponse, totalErrors, totalTasks };
    }, [data]);

    if (loading) return <div className="min-h-[600px] flex items-center justify-center text-slate-500 font-mono">Loading Neural Interface...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">

            {/* Background Neural Connections (Fixed positions for aesthetic) */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <AnimatedConnection from={{ x: 50, y: 100 }} to={{ x: 200, y: 400 }} color="#3b82f6" duration={5} />
                <AnimatedConnection from={{ x: 800, y: 50 }} to={{ x: 600, y: 300 }} color="#8b5cf6" duration={7} delay={1} />
                <AnimatedConnection from={{ x: 1000, y: 500 }} to={{ x: 100, y: 600 }} color="#06b6d4" duration={10} delay={2} />
            </div>

            {/* Header / Nav */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl relative z-10">
                <div
                    className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity group"
                    onClick={() => setActiveTab('overview')}
                >
                    <motion.div
                        ref={brainRef}
                        className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.2)] relative overflow-hidden"
                        animate={{
                            boxShadow: [
                                "0 0 15px rgba(37,99,235,0.2)",
                                "0 0 30px rgba(37,99,235,0.5)",
                                "0 0 15px rgba(37,99,235,0.2)"
                            ]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <Brain className="w-6 h-6 text-blue-400 relative z-10" />

                        {/* Heartbeat ripple */}
                        <motion.div
                            className="absolute inset-0 bg-blue-400/20 rounded-full"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 2, opacity: [0, 1, 0] }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeOut"
                            }}
                        />
                    </motion.div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-white uppercase flex items-center gap-2">
                            Jarvis <span className="text-blue-500">Neural</span> Dashboard
                            <motion.span
                                className="w-1 h-6 bg-blue-500 inline-block"
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                            />
                        </h1>
                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            System Online • Orchestration Layer v4.5
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <ProjectSwitcher />

                    <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-white/5 shadow-inner">
                        {(
                            [
                                { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                                { id: 'tasks', icon: ListTree, label: 'Tasks' },
                                { id: 'performance', icon: BarChart3, label: 'Global Perf' },
                                { id: 'terminal', icon: Layers, label: 'Terminal (Beta)' },
                            ] as const
                        ).map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 relative overflow-hidden ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}

                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="tab-pulse"
                                        className="absolute inset-0 bg-white/20"
                                        animate={{ opacity: [0, 0.2, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-[url('/grid.svg')] bg-opacity-5 z-10">
                <AnimatePresence mode="wait">

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="h-full overflow-y-auto p-8"
                        >
                            <AgentSummaryBar workers={data?.allWorkers || []} />

                            <div className="mb-8" ref={projectsRef}>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                                    <Layers className="w-4 h-4" /> Active Projects
                                </h3>
                                {(data?.projects?.length || 0) > 0 ? (
                                    <ProjectGrid projects={data?.projects} />
                                ) : (
                                    <div className="flex items-center justify-center p-8 bg-white/5 rounded-xl border border-white/10 text-slate-400 italic">
                                        Aucun projet synchronisé
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" ref={statsRef}>
                                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center gap-4 relative overflow-hidden group">
                                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 relative z-10">
                                        <Activity className="w-6 h-6" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-2xl font-bold text-white">{globalStats.activeAgents}</div>
                                        <div className="text-[10px] font-bold uppercase text-slate-500">Active Agents</div>
                                    </div>

                                    {/* Pulse decoration */}
                                    <motion.div
                                        className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                    />
                                </div>

                                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center gap-4 relative overflow-hidden group">
                                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 relative z-10">
                                        <ListTodo className="w-6 h-6" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-2xl font-bold text-white">{globalStats.totalTasks}</div>
                                        <div className="text-[10px] font-bold uppercase text-slate-500">Total Tasks</div>
                                    </div>

                                    <motion.div
                                        className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                                    />
                                </div>

                                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center gap-4 relative overflow-hidden group">
                                    <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 relative z-10">
                                        <ListTree className="w-6 h-6" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="text-2xl font-bold text-white">{data?.projects?.length || 0}</div>
                                        <div className="text-[10px] font-bold uppercase text-slate-500">Total Projects</div>
                                    </div>

                                    <motion.div
                                        className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 6, repeat: Infinity, delay: 2 }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* TASKS TAB */}
                    {activeTab === 'tasks' && (
                        <motion.div
                            key="tasks"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full overflow-hidden"
                        >
                            <ContextTasks />
                        </motion.div>
                    )}

                    {/* PERFORMANCE TAB */}
                    {activeTab === 'performance' && (
                        <motion.div
                            key="performance"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full p-8 overflow-y-auto"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <StatCard
                                    label="Active Agents"
                                    value={globalStats.activeAgents}
                                    subValue="Online or Busy"
                                    icon={Cpu}
                                    colorClass="text-purple-400"
                                />
                                <StatCard
                                    label="Global Avg Response"
                                    value={`${Math.round(globalStats.avgResponse)}ms`}
                                    subValue="Across all agents"
                                    icon={Clock}
                                    colorClass="text-blue-400"
                                />
                                <StatCard
                                    label="Global Error Rate"
                                    value={`${(Math.min(globalStats.totalErrors, 1) * 100).toFixed(2)}%`}
                                    subValue="Avg across agents"
                                    icon={AlertTriangle}
                                    colorClass="text-red-400"
                                />
                            </div>

                            <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 text-center text-slate-500 text-sm">
                                Detailed global performance analytics coming soon.
                            </div>
                        </motion.div>
                    )}

                    {/* TERMINAL TAB */}
                    {activeTab === 'terminal' && (
                        <motion.div
                            key="terminal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full p-8 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-white uppercase tracking-tighter flex items-center gap-3">
                                    <Terminal className="w-5 h-5 text-blue-500" />
                                    System Terminal
                                </h2>
                                <select
                                    className="bg-slate-900 border border-white/20 rounded px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-blue-500 transition-colors"
                                    value={termContainer}
                                    onChange={(e) => setTermContainer(e.target.value)}
                                >
                                    <option value="local">Local Host Shell (ZSH)</option>
                                    {data?.allWorkers.map(w => (
                                        <option key={w.workerId} value={`jarvis-worker-${w.workerId}`}>
                                            Docker: {w.workerId.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex-1 w-full bg-slate-950 rounded-xl overflow-hidden border border-white/10 shadow-inner">
                                <InteractiveTerminal
                                    initialMode={termContainer === 'local' ? 'local' : 'docker'}
                                    containerId={termContainer === 'local' ? '' : termContainer}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function Terminal({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
    );
}