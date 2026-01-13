'use client';

import { useEffect, useState } from 'react';

interface Project {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    techStack: string[];
}

export function useProject() {
    const [projectId, setProjectId] = useState<string>('jarvis');
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const detectAndSetProject = async () => {
            try {
                // Lire le projet depuis le hostname
                const hostname = window.location.hostname;
                const port = window.location.port;
                const fullHost = port ? `${hostname}:${port}` : hostname;

                const projectMap: Record<string, string> = {
                    'jarvis.atelier-sam.fr': 'jarvis',
                    'portfolio.atelier-sam.fr': 'atelier-sam',
                    'esprit.atelier-sam.fr': 'esprit-chalet',
                    'localhost:9000': 'jarvis',
                    'localhost': 'jarvis',
                    process.env.JARVIS_SERVER_IP || 'localhost': 'jarvis',
                    process.env.JARVIS_SERVER_IP || 'localhost': 'jarvis',
                };

                const detectedProject = projectMap[fullHost] || projectMap[hostname] || 'jarvis';
                setProjectId(detectedProject);

                // Mettre à jour le projet actif sur le serveur
                await fetch('/api/projects/active', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId: detectedProject })
                });

                // Charger les infos du projet
                const projectsRes = await fetch('/api/projects');
                const projectsData = await projectsRes.json();
                const projectInfo = projectsData.projects.find((p: Project) => p.id === detectedProject);
                setProject(projectInfo || null);
            } catch (error) {
                console.error('Failed to detect project:', error);
            } finally {
                setLoading(false);
            }
        };

        detectAndSetProject();
    }, []);

    return { projectId, project, loading };
}
