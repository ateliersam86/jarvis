'use client';

import { useEffect, useState } from 'react';
import ProjectSwitcher from '@/components/ProjectSwitcher';

interface Task {
    type: string;
    input: string;
    output: string;
    timestamp: string;
    filesModified?: string[];
}

interface WorkerMemory {
    workerId: string;
    modelId: string;
    status: string;
    statusReason?: string;
    lastActive: string | null;
    totalTasks: number;
    successRate: number;
    recentTasks: Task[];
    expertise: Record<string, number>;
    context: {
        lastFiles: string[];
        lastTopics: string[];
        knownIssues: string[];
    };
    performance: {
        averageResponseTime: number;
        totalTokensUsed: number;
        errorRate: number;
    };
}

interface ConductorData {
    currentPhase: string;
    tasks?: {
        completed?: unknown[];
        inProgress?: unknown[];
        blocked?: unknown[];
    };
}

interface MemoryData {
    projectId: string;
    workers: {
        gemini: WorkerMemory | null;
        claude: WorkerMemory | null;
        chatgpt: WorkerMemory | null;
    };
    conductor: ConductorData | null;
    projectMemory: string;
    timestamp: string;
}

type WorkerMode = 'docker' | 'local';

export default function MemoryDashboard() {
    const [memoryData, setMemoryData] = useState<MemoryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [workerMode, setWorkerMode] = useState<WorkerMode>('docker');

    useEffect(() => {
        const fetchMemory = async () => {
            try {
                const res = await fetch('/api/memory');
                const data = await res.json();
                setMemoryData(data);
            } catch (error) {
                console.error('Failed to fetch memory:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMemory();
        const interval = setInterval(fetchMemory, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <div className="text-lg">Chargement de la mémoire...</div>
            </div>
        );
    }

    if (!memoryData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <div className="text-lg text-red-500">Erreur de chargement</div>
            </div>
        );
    }

    const workers = Object.entries(memoryData.workers).filter(([, data]) => data !== null) as [string, WorkerMemory][];

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <ProjectSwitcher />
                        <h1 className="text-3xl font-bold">🧠 Mémoire</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Worker Mode Toggle */}
                        <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1 border border-gray-700">
                            <button
                                onClick={() => setWorkerMode('local')}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${workerMode === 'local'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                💻 CLIs Locaux
                            </button>
                            <button
                                onClick={() => setWorkerMode('docker')}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${workerMode === 'docker'
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                🐳 Workers Docker
                            </button>
                        </div>

                        <div className="text-sm text-gray-400">
                            Mis à jour: {new Date(memoryData.timestamp).toLocaleTimeString('fr-FR')}
                        </div>
                    </div>
                </div>

                {/* Mode Info Banner */}
                <div className={`p-4 rounded-lg border ${workerMode === 'local'
                    ? 'bg-blue-900/20 border-blue-500'
                    : 'bg-purple-900/20 border-purple-500'
                    }`}>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{workerMode === 'local' ? '💻' : '🐳'}</span>
                        <div>
                            <div className="font-semibold">
                                {workerMode === 'local' ? 'Mode CLIs Locaux' : 'Mode Workers Docker'}
                            </div>
                            <div className="text-sm text-gray-400">
                                {workerMode === 'local'
                                    ? 'Affichage des tâches exécutées par Gemini CLI et Codex CLI (quota illimité)'
                                    : 'Affichage des tâches exécutées par les workers Docker (accès mobile)'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orchestrator Status */}
                {memoryData.conductor && (
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h2 className="text-xl font-bold mb-4">🎯 Orchestrateur - {memoryData.projectId}</h2>
                        <div className="text-sm text-gray-400 mb-4">
                            Phase actuelle: {memoryData.conductor.currentPhase}
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-700 rounded p-4">
                                <div className="text-sm text-gray-400">Tâches Complétées</div>
                                <div className="text-2xl font-bold text-green-400">
                                    {memoryData.conductor.tasks?.completed?.length || 0}
                                </div>
                            </div>
                            <div className="bg-gray-700 rounded p-4">
                                <div className="text-sm text-gray-400">En Cours</div>
                                <div className="text-2xl font-bold text-blue-400">
                                    {memoryData.conductor.tasks?.inProgress?.length || 0}
                                </div>
                            </div>
                            <div className="bg-gray-700 rounded p-4">
                                <div className="text-sm text-gray-400">Bloquées</div>
                                <div className="text-2xl font-bold text-red-400">
                                    {memoryData.conductor.tasks?.blocked?.length || 0}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Workers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {workers.map(([workerId, worker]) => (
                        <div
                            key={workerId}
                            className={`bg-gray-800 rounded-lg p-6 border-2 ${worker.status === 'online' ? 'border-green-500' : 'border-yellow-500'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold capitalize">{workerId}</h3>
                                <span
                                    className={`px-3 py-1 rounded text-sm ${worker.status === 'online'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-yellow-500 text-black'
                                        }`}
                                >
                                    {worker.status}
                                </span>
                            </div>
                            <div className="text-sm text-gray-400 mb-4">{worker.modelId}</div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-gray-700 rounded p-3">
                                    <div className="text-xs text-gray-400">Tâches</div>
                                    <div className="text-xl font-bold">{worker.totalTasks}</div>
                                </div>
                                <div className="bg-gray-700 rounded p-3">
                                    <div className="text-xs text-gray-400">Succès</div>
                                    <div className="text-xl font-bold">
                                        {(worker.successRate * 100).toFixed(0)}%
                                    </div>
                                </div>
                            </div>

                            {/* Expertise */}
                            {Object.keys(worker.expertise).length > 0 && (
                                <div className="mb-4">
                                    <div className="text-sm font-semibold mb-2">Expertise</div>
                                    <div className="space-y-1">
                                        {Object.entries(worker.expertise).map(([skill, count]) => (
                                            <div key={skill} className="flex justify-between text-xs bg-gray-700 rounded px-2 py-1">
                                                <span className="capitalize">{skill}</span>
                                                <span className="font-mono text-blue-400">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Tasks */}
                            {worker.recentTasks.length > 0 && (
                                <div>
                                    <div className="text-sm font-semibold mb-2">Dernières Tâches</div>
                                    <div className="space-y-2">
                                        {worker.recentTasks.slice(0, 3).map((task, idx) => (
                                            <div key={idx} className="text-xs bg-gray-700 rounded p-2">
                                                <div className="font-mono text-blue-400">{task.type}</div>
                                                <div className="text-gray-400 truncate">{task.input}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Known Issues - Only in Docker mode */}
                            {workerMode === 'docker' && worker.context.knownIssues.length > 0 && (
                                <div className="mt-4">
                                    <div className="text-sm font-semibold mb-2 text-yellow-400">Issues Connues</div>
                                    <div className="space-y-1">
                                        {worker.context.knownIssues.map((issue, idx) => (
                                            <div key={idx} className="text-xs text-yellow-400 bg-yellow-900/20 rounded p-2">
                                                {issue}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Empty State for Local Mode */}
                {workerMode === 'local' && workers.every(([, w]) => w.totalTasks === 0) && (
                    <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-8 text-center">
                        <div className="text-4xl mb-4">💻</div>
                        <h3 className="text-xl font-bold mb-2">Aucune tâche CLI locale pour le moment</h3>
                        <p className="text-gray-400 mb-4">
                            Les tâches exécutées via Gemini CLI et Codex CLI apparaîtront ici.
                        </p>
                        <code className="bg-gray-800 px-4 py-2 rounded text-sm">
                            npm run delegate &quot;ta tâche&quot;
                        </code>
                    </div>
                )}

                {/* Tabs remain the same... */}
                <div className="bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex border-b border-gray-700">
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`px-6 py-3 font-semibold ${activeTab === 'tasks'
                                ? 'bg-gray-700 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Historique Tâches
                        </button>
                        <button
                            onClick={() => setActiveTab('context')}
                            className={`px-6 py-3 font-semibold ${activeTab === 'context'
                                ? 'bg-gray-700 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Context Global
                        </button>
                        <button
                            onClick={() => setActiveTab('performance')}
                            className={`px-6 py-3 font-semibold ${activeTab === 'performance'
                                ? 'bg-gray-700 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Performance
                        </button>
                    </div>

                    <div className="p-6">
                        {activeTab === 'tasks' && (
                            <div className="space-y-4">
                                {workers.map(([workerId, worker]) =>
                                    worker.recentTasks.length > 0 ? (
                                        <div key={workerId} className="bg-gray-700 rounded-lg p-4">
                                            <h3 className="text-lg font-bold capitalize mb-4">{workerId} - Historique</h3>
                                            <div className="space-y-3">
                                                {worker.recentTasks.map((task, idx) => (
                                                    <div key={idx} className="bg-gray-800 rounded p-3 border border-gray-600">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">
                                                                {task.type}
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                {new Date(task.timestamp).toLocaleString('fr-FR')}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm mb-1">
                                                            <strong>Input:</strong> {task.input}
                                                        </div>
                                                        <div className="text-sm mb-1">
                                                            <strong>Output:</strong> {task.output}
                                                        </div>
                                                        {task.filesModified && task.filesModified.length > 0 && (
                                                            <div className="text-xs text-gray-400">
                                                                Fichiers: {task.filesModified.join(', ')}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null
                                )}
                            </div>
                        )}

                        {activeTab === 'context' && (
                            <div className="bg-gray-700 rounded p-4">
                                <h3 className="text-lg font-bold mb-4">Mémoire Projet - {memoryData.projectId}</h3>
                                <pre className="text-xs bg-gray-900 p-4 rounded overflow-auto max-h-96 whitespace-pre-wrap">
                                    {memoryData.projectMemory}
                                </pre>
                            </div>
                        )}

                        {activeTab === 'performance' && (
                            <div className="space-y-4">
                                {workers.map(([workerId, worker]) => (
                                    <div key={workerId} className="bg-gray-700 rounded-lg p-4">
                                        <h3 className="text-lg font-bold capitalize mb-4">{workerId}</h3>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-gray-800 rounded p-4">
                                                <div className="text-sm text-gray-400">Temps Moyen</div>
                                                <div className="text-xl font-bold text-blue-400">
                                                    {worker.performance.averageResponseTime}ms
                                                </div>
                                            </div>
                                            <div className="bg-gray-800 rounded p-4">
                                                <div className="text-sm text-gray-400">Tokens Utilisés</div>
                                                <div className="text-xl font-bold text-green-400">
                                                    {worker.performance.totalTokensUsed.toLocaleString()}
                                                </div>
                                            </div>
                                            <div className="bg-gray-800 rounded p-4">
                                                <div className="text-sm text-gray-400">Taux d&apos;Erreur</div>
                                                <div className="text-xl font-bold text-red-400">
                                                    {(worker.performance.errorRate * 100).toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
