'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, 
    Terminal, 
    Database, 
    LayoutDashboard, 
    Cpu, 
    Zap, 
    Shield, 
    ChevronRight,
    X,
    Activity,
    History,
    FileText,
    Monitor
} from 'lucide-react';

type LayerId = 'antigravity' | 'masterscript' | 'agents' | 'memory' | 'dashboard' | null;

const AGENT_INFO = {
    gemini: {
        name: 'Gemini Agent',
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/30',
        icon: Brain,
        description: 'Primary executor for fast iterations and code fixes.',
        models: ['Gemini 2.0 Flash', 'Gemini 1.5 Pro'],
        specialties: ['Lint fixes', 'Documentation', 'Code explanation']
    },
    claude: {
        name: 'Claude Agent',
        color: 'text-violet-400',
        bg: 'bg-violet-500/10',
        border: 'border-violet-500/30',
        icon: Shield,
        description: 'Advanced reasoning agent for architecture and refactoring.',
        models: ['Claude 3.5 Sonnet', 'Claude 3 Opus'],
        specialties: ['Architecture', 'Complex refactoring', 'Security analysis']
    },
    codex: {
        name: 'Codex Agent',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/30',
        icon: Cpu,
        description: 'Specialized agent for code generation and testing.',
        models: ['GPT-4o', 'Codex'],
        specialties: ['Unit testing', 'Prototypes', 'Code optimization']
    }
};

const TAB_INFO = {
    overview: {
        name: 'Overview',
        icon: LayoutDashboard,
        description: 'Real-time health monitoring and agent activity overview.'
    },
    tasks: {
        name: 'Tasks',
        icon: Activity,
        description: 'Task management and execution tracking (from brain/task.md).'
    },
    history: {
        name: 'History',
        icon: History,
        description: 'Full audit log of all agent interactions and modifications.'
    },
    context: {
        name: 'Context',
        icon: FileText,
        description: 'Deep dive into project memory, memory maps and changelogs.'
    },
    terminal: {
        name: 'Terminal',
        icon: Monitor,
        description: 'Direct interactive access to the swarm environment via xterm.js.'
    }
};

export default function ArchitectureDiagram() {
    const [selectedLayer, setSelectedLayer] = useState<LayerId>(null);
    const [hoveredFlow, setHoveredFlow] = useState<string | null>(null);
    const [activeDetail, setActiveDetail] = useState<{ type: 'agent' | 'tab', id: string } | null>(null);

    const handleLayerClick = (id: LayerId) => {
        if (selectedLayer === id) {
            setSelectedLayer(null);
        } else {
            setSelectedLayer(id);
        }
    };

    return (
        <div className="relative w-full max-w-5xl mx-auto min-h-[700px] p-8 bg-slate-900/40 rounded-3xl border border-white/5 backdrop-blur-sm overflow-hidden">
            {/* Connection Lines (Static background flows) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                <defs>
                    <linearGradient id="flowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(56, 189, 248, 0.2)" />
                        <stop offset="100%" stopColor="rgba(139, 92, 246, 0.2)" />
                    </linearGradient>
                </defs>
                
                {/* Vertical Main Trunk */}
                <line x1="50%" y1="100" x2="50%" y2="600" stroke="url(#flowGradient)" strokeWidth="2" strokeDasharray="4 4" />
                
                {/* Hover Highlights */}
                {hoveredFlow === 'orchestration' && (
                    <motion.line 
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        x1="50%" y1="120" x2="50%" y2="220" 
                        stroke="rgba(34, 211, 238, 0.5)" strokeWidth="3" 
                    />
                )}
            </svg>

            <div className="relative z-10 flex flex-col items-center gap-12">
                
                {/* Layer 1: Antigravity */}
                <motion.div 
                    layout
                    onClick={() => handleLayerClick('antigravity')}
                    className={`cursor-pointer group relative p-6 rounded-2xl border transition-all duration-500
                        ${selectedLayer === 'antigravity' ? 'scale-110 z-50 bg-slate-800 border-blue-500 shadow-2xl shadow-blue-500/20' : 'bg-slate-900/80 border-white/10 hover:border-blue-400/50'}
                        ${selectedLayer && selectedLayer !== 'antigravity' ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}
                    `}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-xl">
                            <Brain className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">ANTIGRAVITY</h3>
                            <p className="text-xs text-blue-400 font-mono">Lead Architect Agent (Claude Opus 4.5)</p>
                        </div>
                    </div>
                    {selectedLayer === 'antigravity' && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 text-sm text-slate-400 max-w-md"
                        >
                            Antigravity est le cerveau du système. Il analyse les requêtes complexes, définit le plan d&apos;action et délègue les tâches au Masterscript.
                        </motion.div>
                    )}
                </motion.div>

                {/* Layer 2: Masterscript */}
                <motion.div 
                    layout
                    onMouseEnter={() => setHoveredFlow('orchestration')}
                    onMouseLeave={() => setHoveredFlow(null)}
                    onClick={() => handleLayerClick('masterscript')}
                    className={`cursor-pointer relative p-6 rounded-2xl border transition-all duration-500 w-full max-w-2xl
                        ${selectedLayer === 'masterscript' ? 'scale-105 z-50 bg-slate-800 border-emerald-500 shadow-2xl shadow-emerald-500/20' : 'bg-slate-900/80 border-white/10 hover:border-emerald-400/50'}
                        ${selectedLayer && selectedLayer !== 'masterscript' ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}
                    `}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/20 rounded-xl">
                                <Terminal className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">MASTERSCRIPT.MJS</h3>
                                <p className="text-xs text-emerald-400 font-mono">Orchestration Layer (Node.js)</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {['--normal', '--consensus', '--swarm'].map(flag => (
                                <span key={flag} className="px-2 py-1 bg-slate-950/50 rounded text-[10px] font-mono text-slate-500 border border-white/5">{flag}</span>
                            ))}
                        </div>
                    </div>
                    {selectedLayer === 'masterscript' && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-3 gap-4 mt-6"
                        >
                            <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 text-center">
                                <div className="text-xs font-bold text-slate-300 mb-1">Délégation</div>
                                <div className="text-[10px] text-slate-500">Route les tâches vers les bons agents</div>
                            </div>
                            <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 text-center">
                                <div className="text-xs font-bold text-slate-300 mb-1">Parallélisme</div>
                                <div className="text-[10px] text-slate-500">Gère l&apos;exécution simultanée (Swarm)</div>
                            </div>
                            <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5 text-center">
                                <div className="text-xs font-bold text-slate-300 mb-1">Auto-Verify</div>
                                <div className="text-[10px] text-slate-500">Pipeline de lint et type-check</div>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Layer 3: Agents */}
                <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(['gemini', 'claude', 'codex'] as const).map((agentId) => {
                        const info = AGENT_INFO[agentId];
                        const Icon = info.icon;
                        return (
                            <motion.div
                                key={agentId}
                                layout
                                onClick={() => setActiveDetail({ type: 'agent', id: agentId })}
                                className={`cursor-pointer p-5 rounded-2xl border bg-slate-900/80 transition-all duration-300 hover:-translate-y-2
                                    ${info.border} hover:bg-slate-800
                                    ${selectedLayer && selectedLayer !== 'agents' ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}
                                `}
                            >
                                <div className={`p-3 w-fit rounded-xl mb-4 ${info.bg}`}>
                                    <Icon className={`w-6 h-6 ${info.color}`} />
                                </div>
                                <h4 className="text-lg font-bold text-white mb-1">{info.name}</h4>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {info.specialties.slice(0, 2).map(s => (
                                        <span key={s} className="text-[9px] px-1.5 py-0.5 bg-slate-950/50 rounded-full text-slate-500 border border-white/5">{s}</span>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Layer 4: Memory */}
                <motion.div 
                    layout
                    onClick={() => handleLayerClick('memory')}
                    className={`cursor-pointer p-6 rounded-2xl border transition-all duration-500 w-full max-w-xl
                        ${selectedLayer === 'memory' ? 'scale-105 z-50 bg-slate-800 border-amber-500 shadow-2xl shadow-amber-500/20' : 'bg-slate-900/80 border-white/10 hover:border-amber-400/50'}
                        ${selectedLayer && selectedLayer !== 'memory' ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}
                    `}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500/20 rounded-xl">
                            <Database className="w-8 h-8 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">MEMORY SYSTEM</h3>
                            <p className="text-xs text-amber-400 font-mono">Persistent State & Knowledge Base</p>
                        </div>
                    </div>
                    {selectedLayer === 'memory' && (
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <div className="text-xs space-y-2">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    <span>.memory/projects/</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    <span>.conductor/state.json</span>
                                </div>
                            </div>
                            <div className="text-xs space-y-2">
                                <div className="flex items-center gap-2 text-slate-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    <span>brain/task.md</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    <span>Redis Cache</span>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Layer 5: Dashboard */}
                <motion.div 
                    layout
                    onClick={() => handleLayerClick('dashboard')}
                    className={`cursor-pointer p-6 rounded-2xl border transition-all duration-500 w-full max-w-3xl
                        ${selectedLayer === 'dashboard' ? 'scale-105 z-50 bg-slate-800 border-cyan-500 shadow-2xl shadow-cyan-500/20' : 'bg-slate-900/80 border-white/10 hover:border-cyan-400/50'}
                        ${selectedLayer && selectedLayer !== 'dashboard' ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}
                    `}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-cyan-500/20 rounded-xl">
                                <LayoutDashboard className="w-8 h-8 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">JARVIS DASHBOARD</h3>
                                <p className="text-xs text-cyan-400 font-mono">Next.js 15 UI Layer</p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-cyan-500/20" />)}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {(Object.keys(TAB_INFO) as Array<keyof typeof TAB_INFO>).map((tabId) => {
                            const tab = TAB_INFO[tabId];
                            const TabIcon = tab.icon;
                            return (
                                <button
                                    key={tabId}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveDetail({ type: 'tab', id: tabId });
                                    }}
                                    className="group relative flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-950/40 border border-white/5 hover:border-cyan-500/50 transition-colors"
                                >
                                    <TabIcon className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                                    <span className="text-[10px] text-slate-500 group-hover:text-slate-300 font-medium">{tab.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

            </div>

            {/* Detail Panel Overlay */}
            <AnimatePresence>
                {activeDetail && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
                        onClick={() => setActiveDetail(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className={`relative w-full max-w-md p-8 rounded-3xl border shadow-2xl overflow-hidden
                                ${activeDetail.type === 'agent' 
                                    ? (AGENT_INFO[activeDetail.id as keyof typeof AGENT_INFO].border + ' bg-slate-900') 
                                    : 'border-cyan-500/30 bg-slate-900'}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button 
                                onClick={() => setActiveDetail(null)}
                                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>

                            {activeDetail.type === 'agent' ? (
                                <AgentDetail agentId={activeDetail.id as keyof typeof AGENT_INFO} />
                            ) : (
                                <TabDetail tabId={activeDetail.id as keyof typeof TAB_INFO} />
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
        </div>
    );
}

function AgentDetail({ agentId }: { agentId: keyof typeof AGENT_INFO }) {
    const info = AGENT_INFO[agentId];
    const Icon = info.icon;
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${info.bg}`}>
                    <Icon className={`w-10 h-10 ${info.color}`} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">{info.name}</h2>
                    <p className={`text-sm ${info.color} font-mono`}>AI Sub-Agent</p>
                </div>
            </div>

            <p className="text-slate-400 leading-relaxed">
                {info.description}
            </p>

            <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Modèles</h3>
                <div className="flex flex-wrap gap-2">
                    {info.models.map(m => (
                        <span key={m} className="px-3 py-1 bg-slate-800 rounded-lg text-xs text-slate-300 border border-white/5">
                            {m}
                        </span>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Spécialités</h3>
                <ul className="space-y-2">
                    {info.specialties.map(s => (
                        <li key={s} className="flex items-center gap-3 text-sm text-slate-400">
                            <Zap className={`w-4 h-4 ${info.color}`} />
                            {s}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function TabDetail({ tabId }: { tabId: keyof typeof TAB_INFO }) {
    const info = TAB_INFO[tabId];
    const Icon = info.icon;
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-cyan-500/10">
                    <Icon className="w-10 h-10 text-cyan-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">{info.name}</h2>
                    <p className="text-sm text-cyan-400 font-mono">Dashboard Module</p>
                </div>
            </div>

            <p className="text-slate-400 leading-relaxed">
                {info.description}
            </p>

            <div className="p-6 bg-slate-800/50 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fonctionnalités Clés</h3>
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <ChevronRight className="w-4 h-4 text-cyan-400 mt-0.5" />
                        <div className="text-sm text-slate-300">Interface responsive optimisée pour mobile et desktop.</div>
                    </div>
                    <div className="flex items-start gap-3">
                        <ChevronRight className="w-4 h-4 text-cyan-400 mt-0.5" />
                        <div className="text-sm text-slate-300">Mises à jour en temps réel via WebSockets et Redis.</div>
                    </div>
                    <div className="flex items-start gap-3">
                        <ChevronRight className="w-4 h-4 text-cyan-400 mt-0.5" />
                        <div className="text-sm text-slate-300">Design moderne avec effets de glassmorphism.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
