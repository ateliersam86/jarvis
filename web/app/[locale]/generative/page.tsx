'use client';

import GenerativeShowcase from '@/components/generative/GenerativeShowcase';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function GenerativePage() {
    return (
        <main className="relative w-full h-screen bg-black overflow-hidden">
            <header className="absolute top-0 left-0 right-0 z-30 p-6 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto">
                    <Link
                        href="/"
                        className="p-2 bg-slate-900/50 hover:bg-slate-800 rounded-lg border border-white/10 backdrop-blur-md transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-white">Advanced Shaders</h1>
                        <p className="text-xs text-slate-500">SDFs • Noise • Distortion</p>
                    </div>
                </div>
            </header>

            <GenerativeShowcase />

            <div className="absolute top-6 right-6 z-30 pointer-events-none text-right">
                <div className="text-xs text-cyan-500 font-mono tracking-widest uppercase">Experimental</div>
                <div className="text-white font-bold">Shader Component Library</div>
            </div>
        </main>
    );
}
