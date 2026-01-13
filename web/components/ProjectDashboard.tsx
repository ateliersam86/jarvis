'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    History,
    Brain,
    Activity,
    Terminal as TerminalIcon,
    Cpu,
    Zap,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    BarChart3,
    AlertTriangle,
    Lock,
    ListTodo,
    Layers,
    Database,
    GitBranch
} from 'lucide-react';
import InteractiveTerminal from './InteractiveTerminal';
import { TaskDetailModal } from './TaskDetailModal';
import AgentSummaryBar from './AgentSummaryBar';
import ProjectSwitcher from './ProjectSwitcher';
import { GOOGLE_OAUTH_CONFIG } from '@/lib/google/oauth-config';
import { Home } from 'lucide-react';
import Link from 'next/link';

// Context Components
import ContextTasks from './context/ContextTasks';
import ContextMemory from './context/ContextMemory';
import ContextChangelog from './context/ContextChangelog';
import { MOCK_CHANGELOG } from './context/data';

// --- Types based on JSON structure ---

interface Task {
    taskId: string;
    timestamp: string;
    type: string;
    input: string;
    output: string;
    success: boolean;
    responseTime: number;
    model: string;
    filesModified?: string[];
}

interface WorkerStats {
    averageResponseTime: number;
    totalTokensUsed: number;
    errorRate: number;
}

interface WorkerContext {
    lastFiles: string[];
    lastTopics: string[];
    knownIssues: string[];
    preferences?: Record<string, string>;
}

interface WorkerData {
    workerId: string;
    modelId: string; // Configured ID
    status: string;
    lastActive: string;
    totalTasks: number;
    successRate: number;
    recentTasks: Task[];
    expertise: Record<string, number>;
    context: WorkerContext;
    performance: WorkerStats;
}

interface ConductorState {
    tasks: {
        completed: string[];
        inProgress: string[];
        blocked: { task: string; reason: string }[];
    };
    orchestrator: {
        primary: string;
        delegation: Record<string, string[]>;
    };
    currentPhase: string;
}

interface MemoryResponse {
    projectId: string;
    workers: {
        gemini: WorkerData | null;
        claude: WorkerData | null;
        chatgpt: WorkerData | null;
    };
    conductor?: ConductorState;
    projectMemory: string;
    timestamp: string;
}

type QuotaData = {
    models: Record<string, {
        displayName: string;
        quotaInfo: {
            remainingFraction: number;
            resetTime: string;
        };
        model?: string;
    }>;
};

// --- Helper Components ---

function StatCard({ label, value, subValue, icon: Icon, colorClass }: { label: string, value: string | number, subValue?: string, icon: React.ComponentType<{ className?: string }>, colorClass: string }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</span>
                <Icon className={`w-4 h-4 ${colorClass}`} />
            </div>
            <div>
                <div className="text-2xl font-mono font-bold text-slate-100">{value}</div>
                {subValue && <div className="text-xs text-slate-500 mt-1">{subValue}</div>}
            </div>
        </div>
    );
}

function ExpertiseBar({ skill, level, max, colorClass }: { skill: string, level: number, max: number, colorClass: string }) {
    const percentage = Math.min(100, (level / max) * 100);
    return (
        <div className="mb-2">
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                <span>{skill}</span>
                <span>{level}</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={`h-full ${colorClass}`}
                />
            </div>
        </div>
    );
}

// --- Main Component ---

export default function ProjectDashboard({ projectId, memory }: { projectId?: string; memory?: string }) {
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'history' | 'context' | 'performance' | 'terminal'>('overview');
    const [workerMode, setWorkerMode] = useState<'cli' | 'docker'>('cli');
    const [contextSubTab, setContextSubTab] = useState<'tasks' | 'memory' | 'changelog'>('memory');
    const [data, setData] = useState<MemoryResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

    // Quota State
    const [showAuthCodeInput, setShowAuthCodeInput] = useState(false);
    const [authCode, setAuthCode] = useState('');
    const [realQuota, setRealQuota] = useState<QuotaData | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    // Persistence for Worker Mode
    useEffect(() => {
        const savedMode = localStorage.getItem('jarvis_worker_mode');
        if (savedMode === 'cli' || savedMode === 'docker') {
            setWorkerMode(savedMode);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('jarvis_worker_mode', workerMode);
    }, [workerMode]);

    const fetchData = async () => {
        try {
            const url = projectId ? `/api/memory?project=${projectId}` : '/api/memory';
            const res = await fetch(url);
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error("Failed to fetch memory data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll every 5s
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId]);

    // Quota Logic (from CockpitPanel)
    const fetchRealQuota = async (code?: string, refreshToken?: string) => {
        try {
            const res = await fetch('/api/agents/quota/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, refreshToken })
            });
            const data = await res.json();

            if (data.error) {
                console.error('Quota fetch error:', data.error);
                if (refreshToken) localStorage.removeItem('jarvis_google_refresh_token');
                return;
            }

            if (data.quota) {
                setRealQuota(data.quota);
            }
            if (data.refreshToken) {
                localStorage.setItem('jarvis_google_refresh_token', data.refreshToken);
            }
        } catch (_err) {
            console.error(_err);
        }
    };

    useEffect(() => {
        const storedRefreshToken = localStorage.getItem('jarvis_google_refresh_token');
        if (storedRefreshToken) {
            void fetchRealQuota(undefined, storedRefreshToken);
        }
    }, []);

    const startGoogleAuth = () => {
        const params = new URLSearchParams({
            client_id: GOOGLE_OAUTH_CONFIG.clientId,
            redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
            response_type: 'code',
            scope: GOOGLE_OAUTH_CONFIG.scopes.join(' '),
            access_type: 'offline',
            prompt: 'consent'
        });
        window.open(`${GOOGLE_OAUTH_CONFIG.authUrl}?${params.toString()}`, '_blank');
        setShowAuthCodeInput(true);
    };

    const handleAuthCodeSubmit = async () => {
        if (!authCode) return;
        setIsAuthenticating(true);
        await fetchRealQuota(authCode);
        setIsAuthenticating(false);
        setShowAuthCodeInput(false);
    };

    const getRealQuotaForAgent = (agentName: string) => {
        if (!realQuota?.models) return null;
        const lowerName = agentName.toLowerCase();

        // Simplified mapping logic
        return Object.values(realQuota.models).find(m => {
            const modelId = (m.model || '').toLowerCase();
            const displayName = (m.displayName || '').toLowerCase();

            if (lowerName.includes('gemini') && (modelId.includes('gemini') || displayName.includes('gemini'))) return true;
            if (lowerName.includes('claude') && (modelId.includes('claude') || displayName.includes('claude'))) return true;
            if (lowerName.includes('chatgpt') && (modelId.includes('gpt') || displayName.includes('gpt'))) return true;

            return false;
        });
    };

    // Derived Data
    const workers = useMemo(() => {
        if (!data?.workers) return [];
        return Object.entries(data.workers)
            .filter((entry): entry is [string, WorkerData] => entry[1] !== null)
            .map(([id, w]) => ({ ...w, workerId: id }));
    }, [data]);

    const allTasks = useMemo(() => {
        return workers
            .flatMap(w => w.recentTasks.map(t => ({ ...t, workerId: w.workerId })))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [workers]);

    // Performance Metrics Processing
    const performanceData = useMemo(() => {
        const sortedTasks = [...allTasks].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const byDay: Record<string, { tokens: number; count: number; responseTime: number; success: number }> = {};

        let totalTokens = 0;
        let totalCost = 0;

        sortedTasks.forEach(task => {
            const date = new Date(task.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            if (!byDay[date]) byDay[date] = { tokens: 0, count: 0, responseTime: 0, success: 0 };

            // Estimate tokens if not present (approx 4 chars per token)
            const estTokens = Math.ceil(((task.input?.length || 0) + (task.output?.length || 0)) / 4);

            byDay[date].tokens += estTokens;
            byDay[date].count++;
            byDay[date].responseTime += task.responseTime;
            if (task.success) byDay[date].success++;

            totalTokens += estTokens;

            // Cost Calc (Estimated)
            const model = (task.model || '').toLowerCase();
            let costPer1M = 0.5; // Default generic
            if (model.includes('gemini') && model.includes('flash')) costPer1M = 0.075;
            else if (model.includes('gemini') && model.includes('pro')) costPer1M = 1.25;
            else if (model.includes('claude') && model.includes('sonnet')) costPer1M = 3.00;
            else if (model.includes('claude') && model.includes('opus')) costPer1M = 15.00;
            else if (model.includes('gpt-4o-mini')) costPer1M = 0.15;
            else if (model.includes('gpt-4')) costPer1M = 5.00;

            totalCost += (estTokens / 1_000_000) * costPer1M;
        });

        const history = Object.entries(byDay).map(([date, d]) => ({
            date,
            tokens: d.tokens,
            avgResponse: Math.round(d.responseTime / d.count),
            successRate: d.success / d.count
        })); // Keep all history for now, maybe slice in UI if needed

        return { history, totalTokens, totalCost };
    }, [allTasks]);

    // Global Stats
    const globalStats = useMemo(() => {
        const totalTasks = workers.reduce((acc, w) => acc + w.totalTasks, 0);
        const avgResponse = workers.length ? workers.reduce((acc, w) => acc + w.performance.averageResponseTime, 0) / workers.length : 0;
        const totalFiles = new Set(allTasks.flatMap(t => t.filesModified || [])).size;
        return { totalTasks, avgResponse, totalFiles };
    }, [workers, allTasks]);

    // Theme Helpers
    const getWorkerColor = (id: string) => {
        if (id.includes('gemini')) return 'cyan';
        if (id.includes('chatgpt')) return 'orange';
        if (id.includes('claude')) return 'violet';
        return 'blue';
    };

    const getTwColor = (color: string) => {
        switch (color) {
            case 'cyan': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
            case 'orange': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
            case 'violet': return 'text-violet-400 bg-violet-500/10 border-violet-500/30';
            default: return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        }
    };

    if (loading) return <div className="min-h-[600px] flex items-center justify-center text-slate-500 font-mono">Loading Neural Interface...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">

            {/* Header / Nav */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    {/* Home Button */}
                    <Link href="/dashboard" className="p-2.5 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-white/10 transition-colors" title="Back to Main Dashboard">
                        <Home className="w-5 h-5 text-slate-400 hover:text-white" />
                    </Link>

                    <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                        <Brain className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-white uppercase">Jarvis <span className="text-blue-500">Neural</span> Dashboard</h1>
                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            System Online • {data?.projectId} • <span className="text-blue-400">{workerMode.toUpperCase()}</span>
                        </div>
                    </div>

                    {/* Project Switcher */}
                    <div className="ml-4">
                        <ProjectSwitcher />
                    </div>
                </div>

                {/* Worker Mode Toggle */}
                <div className="hidden lg:flex bg-slate-900/80 p-1 rounded-xl border border-white/5 shadow-inner">
                    <button
                        onClick={() => setWorkerMode('cli')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${workerMode === 'cli'
                            ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                    >
                        <span>💻</span> CLI
                    </button>
                    <button
                        onClick={() => setWorkerMode('docker')}
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${workerMode === 'docker'
                            ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                    >
                        <span>🐳</span> Docker
                    </button>
                </div>

                <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-white/5 shadow-inner">
                    {(
                        [
                            { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                            { id: 'tasks', icon: ListTodo, label: 'Tasks' },
                            { id: 'history', icon: History, label: 'History' },
                            { id: 'context', icon: FileText, label: 'Context' },
                            { id: 'performance', icon: BarChart3, label: 'Perf' },
                            { id: 'terminal', icon: TerminalIcon, label: 'Terminal' },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-[url('/grid.svg')] bg-opacity-5">
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
                            {/* Top Summary & Projects */}
                            <AgentSummaryBar workers={workers} />

                            {/* Orchestrator Status & Global Stats */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                {/* Orchestrator Status */}
                                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                            <ListTodo className="w-4 h-4" /> Orchestrator Status
                                        </h3>
                                        {data?.conductor && (
                                            <span className="text-[10px] px-2 py-1 bg-white/5 rounded border border-white/10 text-slate-400 uppercase">
                                                Phase: {data.conductor.currentPhase}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-bold text-emerald-400">
                                                {data?.conductor?.tasks.completed.length || 0}
                                            </span>
                                            <span className="text-[10px] uppercase text-emerald-500/60 font-bold mt-1">Completed</span>
                                        </div>
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-bold text-blue-400">
                                                {data?.conductor?.tasks.inProgress.length || 0}
                                            </span>
                                            <span className="text-[10px] uppercase text-blue-500/60 font-bold mt-1">In Progress</span>
                                        </div>
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex flex-col items-center justify-center">
                                            <span className="text-2xl font-bold text-red-400">
                                                {data?.conductor?.tasks.blocked.length || 0}
                                            </span>
                                            <span className="text-[10px] uppercase text-red-500/60 font-bold mt-1">Blocked</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Global Stats */}
                                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-4">
                                        <Activity className="w-4 h-4" /> Global Metrics
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-500 uppercase mb-1">Total Tasks</span>
                                            <span className="text-2xl font-bold text-white font-mono">{globalStats.totalTasks}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-500 uppercase mb-1">Avg Response</span>
                                            <span className="text-2xl font-bold text-white font-mono">{Math.round(globalStats.avgResponse)}ms</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-500 uppercase mb-1">Files Mod.</span>
                                            <span className="text-2xl font-bold text-white font-mono">{globalStats.totalFiles}</span>
                                        </div>
                                    </div>

                                    {/* Auth Trigger if needed */}
                                    {!realQuota && (
                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                            <span className="text-[10px] text-slate-500">Enable precise quota tracking?</span>
                                            <button
                                                onClick={startGoogleAuth}
                                                className="text-[10px] flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded transition-colors border border-zinc-700"
                                            >
                                                <Lock className="w-3 h-3" /> Sync Google Quota
                                            </button>
                                        </div>
                                    )}

                                    {/* Auth Input */}
                                    {showAuthCodeInput && (
                                        <div className="mt-2 p-2 bg-black/40 rounded border border-yellow-500/30">
                                            <input
                                                type="text"
                                                className="w-full bg-black border border-zinc-700 rounded px-2 py-1 text-xs font-mono text-green-400 mb-2"
                                                placeholder="Paste code from broken URL..."
                                                value={authCode}
                                                onChange={(e) => setAuthCode(e.target.value)}
                                            />
                                            <button
                                                onClick={handleAuthCodeSubmit}
                                                disabled={isAuthenticating}
                                                className="w-full bg-green-600 text-black text-xs font-bold py-1 rounded"
                                            >
                                                {isAuthenticating ? 'Verifying...' : 'Submit Code'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Workers Grid - Show in all modes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {workers.map((worker) => {
                                    const color = getWorkerColor(worker.workerId);
                                    const styles = getTwColor(color);
                                    const realModel = worker.recentTasks[0]?.model || worker.modelId;
                                    const maxSkill = Math.max(...Object.values(worker.expertise), 10);

                                    // Quota Logic
                                    const realData = getRealQuotaForAgent(worker.workerId);
                                    const usageVal = realData
                                        ? Math.round((1 - (realData.quotaInfo.remainingFraction || 0)) * 100)
                                        : 0; // Default to 0 if unknown
                                    const resetVal = realData
                                        ? new Date(realData.quotaInfo.resetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : '--:--';
                                    const quotaColor = usageVal > 90 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                                        : usageVal > 75 ? 'bg-yellow-500' : styles.replace('text-', 'bg-').split(' ')[1];

                                    return (
                                        <div key={worker.workerId} className="group relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-500 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)]">
                                            {/* Top Glow */}
                                            <div className={`absolute top-0 left-0 w-full h-1 ${styles.replace('text-', 'bg-').split(' ')[1]} opacity-50`} />

                                            <div className="p-6">
                                                {/* Header */}
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-lg border ${styles}`}>
                                                            {worker.workerId[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg text-white capitalize">{worker.workerId}</h3>
                                                            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                                                <Cpu className="w-3 h-3" />
                                                                {realModel}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${worker.status === 'online' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                                        {worker.status}
                                                    </div>
                                                </div>

                                                {/* Quota Bar (New Feature) */}
                                                <div className="mb-6 bg-black/20 p-3 rounded-xl border border-white/5">
                                                    <div className="flex justify-between items-end mb-2">
                                                        <span className="text-[10px] uppercase text-slate-500 font-bold flex items-center gap-1">
                                                            <Zap className="w-3 h-3" /> API Quota Usage
                                                        </span>
                                                        <span className="text-xs font-mono text-slate-300">
                                                            {realData ? `${usageVal}%` : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-black/50 rounded-full overflow-hidden mb-1">
                                                        <div
                                                            className={`h-full transition-all duration-1000 ${quotaColor}`}
                                                            style={{ width: `${Math.max(usageVal, 2)}%` }} // Minimum 2% visibility
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-[9px] text-slate-600 uppercase font-mono">
                                                        <span>Reset: {resetVal}</span>
                                                        <span>{realData ? 'Verified' : 'Unverified'}</span>
                                                    </div>
                                                </div>

                                                {/* Stats Grid */}
                                                <div className="grid grid-cols-2 gap-3 mb-6">
                                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                                        <div className="text-[10px] uppercase text-slate-500 mb-1">Success Rate</div>
                                                        <div className={`text-xl font-bold ${worker.successRate > 0.8 ? 'text-emerald-400' : 'text-orange-400'}`}>
                                                            {Math.round(Math.min(worker.successRate, 1) * 100)}%
                                                        </div>
                                                    </div>
                                                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                                        <div className="text-[10px] uppercase text-slate-500 mb-1">Total Tasks</div>
                                                        <div className="text-xl font-bold text-white">
                                                            {worker.totalTasks}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expertise */}
                                                <div className="mb-6">
                                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                                                        <Layers className="w-3 h-3" /> Expertise
                                                    </div>
                                                    <div className="space-y-2">
                                                        {Object.entries(worker.expertise).slice(0, 3).map(([skill, level]) => (
                                                            <ExpertiseBar
                                                                key={skill}
                                                                skill={skill}
                                                                level={level}
                                                                max={maxSkill}
                                                                colorClass={styles.split(' ')[1].replace('text-', 'bg-')}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Context & Issues - Only shown in Docker mode */}
                                                {workerMode === 'docker' && (worker.context?.knownIssues?.length > 0 || worker.context?.lastFiles?.length > 0) && (
                                                    <div className="mb-6">
                                                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                                                            <Database className="w-3 h-3" /> Context
                                                        </div>
                                                        <div className="space-y-2">
                                                            {worker.context?.knownIssues?.slice(0, 1).map((issue, i) => (
                                                                <div key={i} className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-2 rounded flex items-start gap-2">
                                                                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                                                                    <span>{issue}</span>
                                                                </div>
                                                            ))}
                                                            {worker.context?.lastFiles?.slice(0, 2).map((file, i) => (
                                                                <div key={i} className="text-[10px] bg-blue-500/5 border border-blue-500/10 text-blue-300 p-2 rounded flex items-center gap-2 truncate">
                                                                    <FileText className="w-3 h-3 shrink-0" />
                                                                    <span className="truncate">{file}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Live Activity */}
                                                <div>
                                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                                                        <Activity className="w-3 h-3" /> Live Activity
                                                    </div>
                                                    <div className="space-y-2">
                                                        {worker.recentTasks.slice(0, 3).map((task) => (
                                                            <div key={task.taskId} className="text-[10px] bg-black/40 p-2 rounded border border-white/5 font-mono truncate text-slate-400 flex items-center gap-2">
                                                                <span className={task.success ? 'text-emerald-500' : 'text-red-500'}>{task.success ? '✓' : '✗'}</span>
                                                                <span className="truncate">{task.input}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* HISTORY TAB */}
                    {activeTab === 'history' && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full overflow-hidden flex flex-col"
                        >
                            <div className="overflow-y-auto flex-1 p-6">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-slate-950 z-10 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        <tr>
                                            <th className="p-4 border-b border-white/10">Status</th>
                                            <th className="p-4 border-b border-white/10">Time</th>
                                            <th className="p-4 border-b border-white/10">Agent</th>
                                            <th className="p-4 border-b border-white/10">Model</th>
                                            <th className="p-4 border-b border-white/10 w-1/3">Input</th>
                                            <th className="p-4 border-b border-white/10">Response</th>
                                            <th className="p-4 border-b border-white/10">Files</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 font-mono text-xs">
                                        {allTasks.map((task) => (
                                            <tr
                                                key={task.taskId}
                                                onClick={() => setSelectedTaskId(task.taskId)}
                                                className="hover:bg-white/[0.02] cursor-pointer transition-colors group"
                                            >
                                                <td className="p-4">
                                                    {task.success ? (
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-red-500" />
                                                    )}
                                                </td>
                                                <td className="p-4 text-slate-400">
                                                    {new Date(task.timestamp).toLocaleTimeString()}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getTwColor(getWorkerColor(task.workerId))}`}>
                                                        {task.workerId}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-400">{task.model}</td>
                                                <td className="p-4 text-white truncate max-w-xs font-sans">
                                                    {task.input}
                                                </td>
                                                <td className="p-4 text-slate-400">
                                                    {task.responseTime}ms
                                                </td>
                                                <td className="p-4 text-slate-500 truncate max-w-[150px]">
                                                    {task.filesModified?.length ? task.filesModified.join(', ') : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* CONTEXT TAB */}
                    {activeTab === 'context' && (
                        <motion.div
                            key="context"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="h-full flex flex-col p-8 overflow-hidden"
                        >
                            {/* Sub-nav for Context */}
                            <div className="flex items-center justify-center mb-6">
                                <div className="bg-slate-900/80 p-1 rounded-xl border border-white/10 flex items-center">
                                    {(
                                        [
                                            { id: 'memory', icon: Brain, label: 'Memory' },
                                            { id: 'changelog', icon: GitBranch, label: 'Changelog' },
                                        ] as const
                                    ).map(sub => (
                                        <button
                                            key={sub.id}
                                            onClick={() => setContextSubTab(sub.id)}
                                            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${contextSubTab === sub.id
                                                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(37,99,235,0.2)]'
                                                : 'text-slate-500 hover:text-slate-300'
                                                }`}
                                        >
                                            <sub.icon className="w-3 h-3" />
                                            {sub.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content Render */}
                            <div className="flex-1 overflow-hidden">
                                {contextSubTab === 'memory' && <ContextMemory memory={data?.projectMemory || memory || ''} />}
                                {contextSubTab === 'changelog' && <ContextChangelog items={MOCK_CHANGELOG} />}
                            </div>
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
                            {/* Top Stats Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <StatCard
                                    label="Total Est. Cost"
                                    value={`$${performanceData.totalCost.toFixed(4)}`}
                                    subValue="Based on model pricing"
                                    icon={Zap}
                                    colorClass="text-yellow-400"
                                />
                                <StatCard
                                    label="Est. Tokens Used"
                                    value={performanceData.totalTokens.toLocaleString()}
                                    subValue="~4 chars / token"
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
                                    label="Global Success Rate"
                                    value={`${((workers.reduce((acc, w) => acc + w.successRate, 0) / (workers.length || 1)) * 100).toFixed(1)}%`}
                                    subValue="Task completion rate"
                                    icon={CheckCircle2}
                                    colorClass="text-emerald-400"
                                />
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                {/* Token Usage Chart */}
                                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4" /> Daily Token Usage
                                    </h3>
                                    <div className="h-48 flex items-end gap-2">
                                        {performanceData.history.map((day, i) => {
                                            const maxTokens = Math.max(...performanceData.history.map(d => d.tokens), 100);
                                            const height = (day.tokens / maxTokens) * 100;
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center group">
                                                    <div className="w-full relative flex items-end h-full">
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${height}%` }}
                                                            className="w-full bg-blue-500/20 border-t border-blue-500/50 rounded-t min-h-[4px] group-hover:bg-blue-500/40 transition-colors relative"
                                                        >
                                                            {/* Tooltip */}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-xs px-2 py-1 rounded border border-white/10 whitespace-nowrap z-10 pointer-events-none">
                                                                {day.tokens.toLocaleString()} tokens
                                                            </div>
                                                        </motion.div>
                                                    </div>
                                                    <div className="mt-2 text-[9px] text-slate-500 font-mono rotate-0 truncate w-full text-center">
                                                        {day.date}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {performanceData.history.length === 0 && (
                                            <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                                                No activity recorded
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Response Time Chart */}
                                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                                        <Activity className="w-4 h-4" /> Avg Response Time (ms)
                                    </h3>
                                    <div className="h-48 flex items-end gap-2">
                                        {performanceData.history.map((day, i) => {
                                            const maxTime = Math.max(...performanceData.history.map(d => d.avgResponse), 1000);
                                            const height = (day.avgResponse / maxTime) * 100;
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center group">
                                                    <div className="w-full relative flex items-end h-full">
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${height}%` }}
                                                            className="w-full bg-emerald-500/20 border-t border-emerald-500/50 rounded-t min-h-[4px] group-hover:bg-emerald-500/40 transition-colors relative"
                                                        >
                                                            {/* Tooltip */}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-xs px-2 py-1 rounded border border-white/10 whitespace-nowrap z-10 pointer-events-none">
                                                                {day.avgResponse}ms
                                                            </div>
                                                        </motion.div>
                                                    </div>
                                                    <div className="mt-2 text-[9px] text-slate-500 font-mono rotate-0 truncate w-full text-center">
                                                        {day.date}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {performanceData.history.length === 0 && (
                                            <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                                                No activity recorded
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Agent Detailed Cards */}
                            <div className="grid grid-cols-1 gap-6">
                                {workers.map((worker) => {
                                    const estWorkerTokens = worker.recentTasks.reduce((acc, t) => acc + Math.ceil(((t.input?.length || 0) + (t.output?.length || 0)) / 4), 0);

                                    return (
                                        <div key={worker.workerId} className="bg-slate-900/50 border border-white/10 rounded-2xl p-6">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold border ${getTwColor(getWorkerColor(worker.workerId))}`}>
                                                    {worker.workerId[0].toUpperCase()}
                                                </div>
                                                <h3 className="text-lg font-bold capitalize text-white">{worker.workerId} Details</h3>
                                                <div className="h-px bg-white/10 flex-1" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                <StatCard
                                                    label="Avg Response"
                                                    value={`${worker.performance.averageResponseTime}ms`}
                                                    icon={Clock}
                                                    colorClass="text-blue-400"
                                                />
                                                <StatCard
                                                    label="Tokens (Est)"
                                                    value={estWorkerTokens.toLocaleString()}
                                                    subValue={worker.performance.totalTokensUsed > 0 ? `Reported: ${worker.performance.totalTokensUsed}` : 'Estimated'}
                                                    icon={Cpu}
                                                    colorClass="text-purple-400"
                                                />
                                                <StatCard
                                                    label="Success Rate"
                                                    value={`${(Math.min(worker.successRate, 1) * 100).toFixed(1)}%`}
                                                    icon={CheckCircle2}
                                                    colorClass={worker.successRate > 0.8 ? "text-emerald-400" : "text-orange-400"}
                                                />
                                                <StatCard
                                                    label="Error Rate"
                                                    value={`${(Math.min(worker.performance.errorRate, 1) * 100).toFixed(2)}%`}
                                                    icon={AlertTriangle}
                                                    colorClass="text-red-400"
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* TASKS TAB - Dedicated Brain Tasks View */}
                    {activeTab === 'tasks' && (
                        <motion.div
                            key="tasks"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col p-8 overflow-hidden"
                        >
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-white mb-2">🧠 Brain Tasks</h2>
                                <p className="text-sm text-slate-400">Antigravity task.md synced in real-time</p>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <ContextTasks projectId={projectId} />
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
                            className="h-full flex flex-col p-4"
                        >
                            <InteractiveTerminal className="flex-1 rounded-2xl border-white/10 shadow-2xl" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            {selectedTaskId && (
                <TaskDetailModal
                    taskId={selectedTaskId}
                    onClose={() => setSelectedTaskId(null)}
                />
            )}
        </div>
    );
}
