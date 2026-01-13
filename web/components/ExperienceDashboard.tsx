'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Hand,
    Cpu,
    Camera,
    CameraOff,
    Maximize2,
    Settings,
    Zap,
    Wind,
    Terminal as TerminalIcon
} from 'lucide-react';

interface HandMetrics {
    distance: number;
    rotation: number;
    isTracking: boolean;
    velocity: number;
}

interface ExperienceDashboardProps {
    metrics: HandMetrics;
    isCameraActive: boolean;
    onToggleCamera: () => void;
    activeMode: string;
    onModeChange: (mode: string) => void;
    fps: number;
    videoRef: React.RefObject<HTMLVideoElement | null>;
}

export default function ExperienceDashboard({
    metrics,
    isCameraActive,
    onToggleCamera,
    activeMode,
    onModeChange,
    fps,
    videoRef
}: ExperienceDashboardProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const modes = [
        { id: 'default', label: 'Neural', icon: BrainIcon },
        { id: 'glitch', label: 'Glitch', icon: Zap },
        { id: 'particle', label: 'Ethereal', icon: Wind },
        { id: 'boolean', label: 'Boolean', icon: Cpu },
    ];

    return (
        <div className="absolute inset-0 pointer-events-none z-20 p-6 pt-24 md:p-6 flex flex-col justify-between">
            {/* Top Bar: System Status & Controls */}
            <div className="flex flex-col md:flex-row items-start justify-between pointer-events-auto gap-4 md:gap-0">
                <div className="flex flex-col gap-2">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-2xl"
                    >
                        <div className={`p-2 rounded-xl ${isCameraActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'} transition-colors`}>
                            {isCameraActive ? <Activity className="w-5 h-5 animate-pulse" /> : <CameraOff className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Neural Feed</div>
                            <div className="text-sm font-bold text-white flex items-center gap-2">
                                {isCameraActive ? 'SYSTEM ACTIVE' : 'SYSTEM STANDBY'}
                                {isCameraActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />}
                            </div>
                        </div>
                    </motion.div>

                    <AnimatePresence>
                        {isCameraActive && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-1 mt-2 flex gap-1 shadow-xl w-fit">
                                    {modes.map((mode) => (
                                        <button
                                            key={mode.id}
                                            onClick={() => onModeChange(mode.id)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${activeMode === mode.id
                                                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <mode.icon className="w-3 h-3" />
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onToggleCamera}
                        className={`p-3 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${isCameraActive
                            ? 'bg-red-500/10 border-red-500/50 text-red-500'
                            : 'bg-cyan-500/10 border-cyan-500/50 text-cyan-500'
                            } backdrop-blur-xl shadow-lg`}
                    >
                        {isCameraActive ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                    </button>
                    <button className="p-3 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all shadow-lg">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Bottom Section: Metrics & Feedback */}
            <div className="flex items-end justify-between pointer-events-auto">
                <div className="flex gap-4 items-end">
                    {/* FPS Counter */}
                    <div className="bg-slate-950/40 backdrop-blur-md border border-white/5 rounded-xl px-3 py-1.5 flex items-center gap-2 mb-2">
                        <TerminalIcon className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-mono font-bold text-emerald-500/80">{fps} FPS</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 md:flex md:gap-4 w-full md:w-auto">
                        <MetricCard
                            icon={<Zap className="w-5 h-5" />}
                            label="Velocity"
                            value={metrics.velocity.toFixed(3)}
                            active={metrics.isTracking}
                            color="cyan"
                        />
                        <MetricCard
                            icon={<Hand className="w-5 h-5" />}
                            label="Proximity"
                            value={metrics.distance.toFixed(3)}
                            active={metrics.isTracking}
                            color="cyan"
                        />
                        <MetricCard
                            icon={<Maximize2 className="w-5 h-5" />}
                            label="Rotation"
                            value={metrics.rotation.toFixed(3)}
                            active={metrics.isTracking}
                            color="purple"
                        />
                    </div>

                </div>

                {/* Hand View Mini-Map */}
                <div className="relative group">
                    <motion.div
                        layout
                        className={`rounded-2xl overflow-hidden border border-white/10 bg-black/60 backdrop-blur-2xl shadow-2xl transition-all duration-500 ${isExpanded ? 'w-64 h-48' : 'w-16 h-16'
                            }`}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />

                        {/* Video Element */}
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover scale-x-[-1] opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700"
                            autoPlay
                            playsInline
                            muted
                        />

                        {!isCameraActive && (
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                                <Cpu className="w-6 h-6 text-slate-700 animate-pulse" />
                            </div>
                        )}

                        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${metrics.isTracking ? 'bg-cyan-500 animate-pulse' : 'bg-slate-600'}`} />
                            <span className="text-[8px] font-bold text-white/50 uppercase tracking-widest">Live Scan</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({
    icon,
    label,
    value,
    active,
    color
}: {
    icon: React.ReactNode,
    label: string,
    value: string,
    active: boolean,
    color: 'cyan' | 'purple'
}) {
    const colors = {
        cyan: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
        purple: 'text-purple-400 border-purple-500/30 bg-purple-500/5'
    };

    return (
        <motion.div
            animate={{
                borderColor: active ? undefined : 'rgba(255,255,255,0.1)',
                scale: active ? 1.02 : 1
            }}
            className={`w-full md:w-32 p-3 md:p-4 rounded-2xl border backdrop-blur-xl transition-all ${active ? colors[color] : 'bg-slate-900/20 border-white/10 text-slate-500'}`}
        >
            <div className="flex items-center justify-between mb-3">
                <div className={active ? colors[color].split(' ')[0] : 'text-slate-600'}>
                    {icon}
                </div>
                {active && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`w-1.5 h-1.5 rounded-full ${color === 'cyan' ? 'bg-cyan-400' : 'bg-purple-400'}`}
                    />
                )}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">{label}</div>
            <div className="text-xl font-mono font-black tracking-tighter">{value}</div>
        </motion.div>
    );
}

function BrainIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54Z" />
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54Z" />
        </svg>
    );
}
