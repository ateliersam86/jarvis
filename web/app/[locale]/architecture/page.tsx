'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Layers, Terminal, Database, Shield, Eye, ChevronDown, Cpu, Activity, LucideIcon } from 'lucide-react';
import ArchitectureDiagram from '@/components/ArchitectureDiagram';

// --- Components ---

export default function ArchitecturePage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-400" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600/20 rounded-xl border border-blue-500/30">
                                <Brain className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black uppercase tracking-tight">Neural <span className="text-blue-500">Architecture</span></h1>
                                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">System Intelligence Map</p>
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            Core Engine v2.0
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-12 space-y-24 relative">

                {/* Hero Section */}
                <section className="text-center space-y-6">
                    <motion.h2
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent"
                    >
                        Multi-AI Nexus
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-400 max-w-3xl mx-auto font-medium"
                    >
                        A distributed intelligence platform orchestrating state-of-the-art LLMs
                        for complex engineering tasks, automated verification, and persistent memory.
                    </motion.p>
                </section>

                {/* Main Architecture Diagram */}
                <section className="space-y-6">
                    <SectionHeader icon={Layers} title="Architecture Globale Interactive" />
                    <ArchitectureDiagram />
                </section>

                {/* Masterscript Modes */}
                <section className="space-y-8">
                    <SectionHeader icon={Terminal} title="Execution Engines" />
                    <div className="grid md:grid-cols-3 gap-6">
                        <ModeCard
                            title="Normal Mode"
                            flag="--model gemini:pro"
                            agents={1}
                            color="cyan"
                            description="Direct delegation to a single agent. Optimized for rapid iterations and specialized fixes."
                            steps={[
                                "Parse user prompt",
                                "Context detection",
                                "Agent delegation",
                                "Memory synchronization"
                            ]}
                        />
                        <ModeCard
                            title="Consensus Mode"
                            flag="--consensus"
                            agents={2}
                            color="purple"
                            description="Parallel execution across multiple providers with automated synthesis of findings."
                            steps={[
                                "Dual parallel requests",
                                "Gemini Pro + Claude Sonnet",
                                "Response analysis",
                                "Gemini Flash synthesis"
                            ]}
                        />
                        <ModeCard
                            title="Swarm Mode"
                            flag="--swarm"
                            agents="N"
                            color="orange"
                            description="Autonomous task decomposition into specialized sub-tasks executed by a dynamic worker pool."
                            steps={[
                                "Task decomposition",
                                "Worker pool allocation",
                                "Live progress tracking",
                                "Final aggregation"
                            ]}
                        />
                    </div>
                </section>

                {/* AutoVerify Pipeline */}
                <section className="space-y-8">
                    <SectionHeader icon={Shield} title="Quality Assurance Pipeline" />
                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md">
                        <div className="flex flex-wrap items-center justify-center gap-8 text-center">
                            <PipelineStep icon={<Eye className="w-8 h-8 text-cyan-400" />} title="Analysis" description="Linting & Static Analysis" />
                            <Arrow />
                            <PipelineStep icon={<Layers className="w-8 h-8 text-blue-400" />} title="Verification" description="TypeScript Type Checking" />
                            <Arrow />
                            <PipelineStep icon={<Cpu className="w-8 h-8 text-purple-400" />} title="AI Correction" description="Automated Healing" />
                            <Arrow />
                            <PipelineStep icon={<Activity className="w-8 h-8 text-green-400" />} title="Validation" description="Regression Testing" />
                            <Arrow />
                            <PipelineStep icon={<Database className="w-8 h-8 text-orange-400" />} title="Persistence" description="Memory Update & Sync" />
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="text-center text-slate-500 py-12 border-t border-white/5">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="h-px w-12 bg-white/10" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Jarvis Intelligence System</span>
                        <div className="h-px w-12 bg-white/10" />
                    </div>
                    <p className="text-xs">Next.js 15 • React 19 • Tailwind 4 • Framer Motion</p>
                </footer>

            </main>
        </div>
    );
}

// Helper Components

function SectionHeader({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
    return (
        <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                <Icon className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-3xl font-black tracking-tight">{title}</h3>
        </div>
    );
}

function ModeCard({ title, flag, agents, color, description, steps }: {
    title: string; flag: string; agents: number | string; color: string; description: string; steps: string[]
}) {
    const colorClasses = {
        cyan: 'border-cyan-500/20 bg-cyan-500/5 shadow-cyan-500/5',
        purple: 'border-purple-500/20 bg-purple-500/5 shadow-purple-500/5',
        orange: 'border-orange-500/20 bg-orange-500/5 shadow-orange-500/5',
    }[color as 'cyan' | 'purple' | 'orange'] || 'border-white/10';

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`rounded-3xl border p-8 space-y-6 backdrop-blur-sm transition-all ${colorClasses}`}
        >
            <div className="flex justify-between items-start">
                <h4 className="text-xl font-bold">{title}</h4>
                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    {agents} Agent{agents !== 1 ? 's' : ''}
                </span>
            </div>
            <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                <code className="text-[10px] text-blue-400 font-mono">{flag}</code>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
            <ul className="space-y-3">
                {steps.map((step, i) => (
                    <li key={i} className="flex items-center gap-3 text-xs text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        {step}
                    </li>
                ))}
            </ul>
        </motion.div>
    );
}

function PipelineStep({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex flex-col items-center gap-4 min-w-[140px]">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                {icon}
            </div>
            <div>
                <div className="text-sm font-bold text-slate-200">{title}</div>
                <div className="text-[10px] font-medium text-slate-500 mt-1 uppercase tracking-wider">{description}</div>
            </div>
        </div>
    );
}

function Arrow() {
    return (
        <div className="hidden lg:block">
            <ChevronDown className="w-5 h-5 text-slate-700 -rotate-90" />
        </div>
    );
}
