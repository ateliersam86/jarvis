'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, 
    RefreshCw, 
    Folder, 
    Clock, 
    CheckCircle2, 
    MoreHorizontal,
    Search,
    ListTodo,
    ChevronRight,
    Terminal,
    Plus
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

interface ProjectV1 {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color: string;
    localPath?: string;
    taskCount: number;
    lastSynced?: string;
    updatedAt: string;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<ProjectV1[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/v1/projects');
            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects || []);
            }
        } catch (error) {
            console.error("Failed to fetch projects", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleSyncAll = async () => {
        setIsSyncing(true);
        // Simulate sync delay for visual feedback
        // In a real implementation, this would call /api/v1/projects/trigger-sync
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Refresh list
        await fetchProjects();
        setIsSyncing(false);
    };

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="h-full flex flex-col p-8 space-y-8 bg-slate-950 text-slate-200 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="rounded-xl h-12 w-12 p-0 hover:bg-white/10 text-slate-400 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                            <Folder className="w-8 h-8 text-blue-500" />
                            Projects
                        </h1>
                        <p className="text-slate-500 font-medium">Manage and synchronize your local workspaces.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input 
                            placeholder="Search projects..." 
                            className="pl-9 w-64 bg-white/5 border-white/10 text-slate-200 focus:border-blue-500/50 rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button 
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl px-4 h-10 font-bold mr-2"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Project
                    </Button>
                    <Button 
                        onClick={handleSyncAll} 
                        disabled={isSyncing}
                        className={`bg-blue-600 hover:bg-blue-500 text-white border-0 rounded-xl px-6 h-10 font-bold transition-all duration-300 ${isSyncing ? 'opacity-80' : 'shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)]'}`}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync All'}
                    </Button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
                        <p className="text-slate-500 font-mono text-sm">Loading projects...</p>
                    </div>
                </div>
            ) : (
                <motion.div 
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                    <AnimatePresence>
                        {filteredProjects.map((project) => (
                            <motion.div key={project.id} variants={item} layout>
                                <Card className="group relative overflow-hidden bg-white/5 border-white/10 hover:border-blue-500/30 hover:bg-white/[0.07] transition-all duration-300 h-full backdrop-blur-sm rounded-2xl">
                                    {/* Color Glow */}
                                    <div 
                                        className="absolute top-0 left-0 w-full h-1 opacity-50 group-hover:opacity-100 transition-opacity duration-300"
                                        style={{ backgroundColor: project.color || '#3b82f6' }}
                                    />
                                    
                                    <div className="p-6 flex flex-col h-full">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5 text-slate-300 group-hover:scale-105 transition-transform duration-300">
                                                <Terminal className="w-6 h-6" style={{ color: project.color }} />
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                    project.localPath 
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                                    : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                                }`}>
                                                    {project.localPath ? 'Linked' : 'Remote'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex-1 mb-6">
                                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                                {project.name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono bg-black/20 px-2 py-1 rounded w-fit max-w-full overflow-hidden truncate">
                                                <Folder className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate">{project.localPath || 'No local path'}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 py-4 border-t border-white/5">
                                            <div>
                                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Tasks</div>
                                                <div className="text-lg font-mono font-bold text-slate-200 flex items-center gap-2">
                                                    <ListTodo className="w-4 h-4 text-purple-400" />
                                                    {project.taskCount}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Last Sync</div>
                                                <div className="text-xs font-mono font-medium text-slate-400 flex items-center gap-2 mt-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {project.lastSynced ? new Date(project.lastSynced).toLocaleDateString() : 'Never'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 mt-auto">
                                            <Button 
                                                variant="outline" 
                                                className="w-full justify-between group-hover:border-blue-500/30 group-hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                                                onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
                                            >
                                                <span className="text-xs font-bold uppercase tracking-widest">View Details</span>
                                                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </div>
                                        
                                        {/* Expandable Content (Inline) */}
                                        <AnimatePresence>
                                            {selectedProject === project.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="pt-4 mt-4 border-t border-dashed border-white/10 space-y-3">
                                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                                            <span>Project ID:</span>
                                                            <span className="font-mono text-slate-500">{project.id.substring(0, 8)}...</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                                            <span>Slug:</span>
                                                            <span className="font-mono text-slate-500">{project.slug}</span>
                                                        </div>
                                                        <Link href={`/dashboard?project=${project.id}`} className="block">
                                                            <Button size="sm" className="w-full bg-slate-800 hover:bg-slate-700 text-xs mt-2">
                                                                Open in Dashboard
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {!loading && filteredProjects.length === 0 && (
                <div className="text-center py-20 opacity-50">
                    <Folder className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <h3 className="text-xl font-bold text-slate-400">No projects found</h3>
                    <p className="text-slate-600">Try running <code className="bg-slate-900 px-2 py-1 rounded text-slate-400">jarvis-config sync</code> in your terminal.</p>
                </div>
            )}
        </div>
    );
}
