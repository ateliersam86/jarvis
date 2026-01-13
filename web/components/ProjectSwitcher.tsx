'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Check, Box } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Project {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
}

export default function ProjectSwitcher() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsRes, activeRes] = await Promise.all([
                    fetch('/api/projects'),
                    fetch('/api/projects/active')
                ]);

                const projectsData = await projectsRes.json();
                const activeData = await activeRes.json();

                setProjects(projectsData.projects);
                const active = projectsData.projects.find((p: Project) => p.id === activeData.projectId);
                setActiveProject(active || projectsData.projects[0]); // Fallback to first if none active
            } catch (error) {
                console.error('Failed to fetch projects:', error);
            }
        };

        fetchData();
    }, []);

    const switchProject = async (projectId: string) => {
        if (loading || projectId === activeProject?.id) return;

        setLoading(true);
        try {
            await fetch('/api/projects/active', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            });

            const newActive = projects.find(p => p.id === projectId);
            if (newActive) setActiveProject(newActive);

            setIsOpen(false);
            // Optional: Reload if deep context switch is needed, otherwise client state update might be enough
            // window.location.reload(); 
            router.refresh();
        } catch (error) {
            console.error('Failed to switch project:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!activeProject) return null;

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-3 py-2 bg-slate-900/50 hover:bg-slate-800/70 border border-white/10 hover:border-white/20 rounded-xl transition-all backdrop-blur-md group min-w-[200px]"
                disabled={loading}
            >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-xl group-hover:scale-105 transition-transform">
                    {activeProject.icon || <Box className="w-4 h-4 text-blue-400" />}
                </div>
                <div className="flex-1 text-left">
                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Current Project</div>
                    <div className="text-sm font-bold text-slate-100 truncate max-w-[120px]">{activeProject.name}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 mt-2 w-64 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl z-[100] overflow-hidden"
                        >
                            <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {projects.map((project) => (
                                    <button
                                        key={project.id}
                                        onClick={() => switchProject(project.id)}
                                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${project.id === activeProject.id
                                                ? 'bg-blue-600/20 border border-blue-500/30'
                                                : 'hover:bg-white/5 border border-transparent'
                                            }`}
                                    >
                                        <div className="text-lg w-6 text-center">{project.icon}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-semibold truncate ${project.id === activeProject.id ? 'text-blue-200' : 'text-slate-200'}`}>
                                                {project.name}
                                            </div>
                                            <div className="text-[10px] text-slate-500 truncate">{project.description}</div>
                                        </div>
                                        {project.id === activeProject.id && (
                                            <Check className="w-4 h-4 text-blue-400" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
