'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
    Cpu, 
    Activity, 
    ArrowRight,
    Terminal,
    UtensilsCrossed,
    Camera,
    Plane,
    Mountain
} from 'lucide-react';
import { Project } from '@/lib/types';

// --- Helper to map emoji/string icon to Lucide component or keep as text ---
const ProjectIcon = ({ icon, color = '#cbd5e1' }: { icon: string, color?: string }) => {
    // Map specific IDs to Lucide icons for a more technical look, fallback to text emoji
    const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
        '🤖': Terminal,
        '🍳': UtensilsCrossed,
        '📸': Camera,
        '✈️': Plane,
        '🏔️': Mountain
    };

    const IconComponent = iconMap[icon];

    if (IconComponent) {
        return <IconComponent className="w-8 h-8" style={{ color }} />;
    }
    return <span className="text-3xl">{icon}</span>;
};

// --- Component ---

export default function ProjectGrid({ projects: initialProjects }: { projects?: Project[] }) {
    const [fetchedProjects, setFetchedProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(!initialProjects);

    // Use initialProjects if available, otherwise fetchedProjects
    const projects = initialProjects || fetchedProjects;

    useEffect(() => {
        // Only fetch if we don't have initial projects
        if (!initialProjects) {
            fetch('/api/projects')
                .then(res => res.json())
                .then(data => {
                    if (data.projects) {
                        setFetchedProjects(data.projects);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to fetch projects", err);
                    setLoading(false);
                });
        }
    }, [initialProjects]);

    if (loading && !projects.length) {
        return <div className="p-6 text-slate-500 font-mono text-sm">Loading projects...</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project, index) => (
                <Link href={`/${project.id}`} key={project.id} className="block group h-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative h-full bg-surface/50 border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)] flex flex-col"
                    >
                        {/* Top Glow */}
                        <div 
                            className="absolute top-0 left-0 w-full h-1 opacity-50 transition-opacity group-hover:opacity-100" 
                            style={{ backgroundColor: project.color }} 
                        />

                        <div className="p-6 flex-1 flex flex-col">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-background/50 rounded-lg border border-white/5 group-hover:scale-105 transition-transform duration-300">
                                    <ProjectIcon icon={project.icon} color={project.color} />
                                </div>
                                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                    project.status === 'active' 
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                        : 'bg-muted/10 border-muted/20 text-muted'
                                }`}>
                                    {project.status || 'Idle'}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="mb-6 flex-1">
                                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                                    {project.name}
                                </h3>
                                <p className="text-sm text-muted font-medium leading-relaxed">
                                    {project.description}
                                </p>
                            </div>

                            {/* Footer Stats */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-4 text-xs font-mono text-muted">
                                    <div className="flex items-center gap-1.5">
                                        <Cpu className="w-3.5 h-3.5" />
                                        <span>{project.activeAgents || project.agentCount || 0} Agents</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Activity className="w-3.5 h-3.5" />
                                        <span>v1.0.0</span>
                                    </div>
                                </div>
                                
                                <div className="p-2 rounded-lg bg-background/50 text-muted group-hover:bg-primary/10 group-hover:text-primary transition-all transform group-hover:translate-x-1">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </Link>
            ))}
        </div>
    );
}