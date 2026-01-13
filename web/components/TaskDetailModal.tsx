'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskDetailProps {
    taskId: string;
    onClose: () => void;
}

interface TaskData {
    error?: string;
    task?: {
        success: boolean;
        timestamp: string;
        responseTime: number;
        model?: string;
        mode?: string;
        input: string;
        output: string;
        filesModified?: string[];
    };
    projectId?: string;
    agentId?: string;
    agent?: {
        modelId: string;
        totalTasks: number;
        successRate: number;
    };
}

export function TaskDetailModal({ taskId, onClose }: TaskDetailProps) {
    const [task, setTask] = useState<TaskData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/tasks/${taskId}`)
            .then(res => res.json())
            .then(data => {
                setTask(data);
                setLoading(false);
            });
    }, [taskId]);

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-gray-800 p-8 rounded-lg">
                    <div className="animate-spin text-4xl">⚙️</div>
                </div>
            </div>
        );
    }

    if (!task || task.error || !task.task || !task.agent) {
        return (
            <AnimatePresence>
                <motion.div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="bg-gray-900 rounded-lg max-w-md w-full p-6 border border-red-900/50"
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.9 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center">
                            <div className="text-red-500 text-4xl mb-4">⚠️</div>
                            <h2 className="text-xl font-bold text-white mb-2">Task Not Found</h2>
                            <p className="text-gray-400 mb-6">
                                {task?.error || "The requested task details could not be retrieved."}
                            </p>
                            <button
                                onClick={onClose}
                                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>
        );
    }

    const getThinkingModeColor = (mode: string) => {
        switch (mode) {
            case 'low': return 'text-blue-400';
            case 'standard': return 'text-green-400';
            case 'high': return 'text-yellow-400';
            case 'deep': return 'text-orange-400';
            case 'very-high': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const t = task.task!;
    const a = task.agent!;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Task Details</h2>
                                <div className="text-sm text-gray-400 mt-1">
                                    {task.projectId} / {task.agentId}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white text-2xl"
                            >
                                ×
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Status */}
                        <div className="flex items-center gap-4">
                            <div className={`px-3 py-1 rounded-full text-sm ${t.success ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                                }`}>
                                {t.success ? '✓ Success' : '✗ Failed'}
                            </div>
                            <div className="text-sm text-gray-400">
                                {new Date(t.timestamp).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-400">
                                {t.responseTime}ms
                            </div>
                        </div>

                        {/* Model Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-800/50 p-4 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">Model</div>
                                <div className="font-mono text-blue-400">{t.model || a.modelId}</div>
                            </div>
                            <div className="bg-gray-800/50 p-4 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">Thinking Mode</div>
                                <div className={`font-semibold ${getThinkingModeColor(t.mode || 'standard')}`}>
                                    {t.mode || 'standard'}
                                </div>
                            </div>
                        </div>

                        {/* Input */}
                        <div>
                            <div className="text-sm font-semibold text-gray-400 mb-2">📝 Input (Question)</div>
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                <pre className="whitespace-pre-wrap text-sm">{t.input}</pre>
                            </div>
                        </div>

                        {/* Output */}
                        <div>
                            <div className="text-sm font-semibold text-gray-400 mb-2">💬 Output (Response)</div>
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                <pre className="whitespace-pre-wrap text-sm">{t.output}</pre>
                            </div>
                        </div>

                        {/* Files Modified */}
                        {t.filesModified && t.filesModified.length > 0 && (
                            <div>
                                <div className="text-sm font-semibold text-gray-400 mb-2">📁 Files Modified</div>
                                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                    <ul className="space-y-1">
                                        {t.filesModified.map((file: string, idx: number) => (
                                            <li key={idx} className="text-sm font-mono text-blue-400">
                                                {file}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* Agent Stats */}
                        <div className="border-t border-gray-700 pt-6">
                            <div className="text-sm font-semibold text-gray-400 mb-3">Agent Statistics</div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-800/50 p-3 rounded text-center">
                                    <div className="text-2xl font-bold text-blue-400">{a.totalTasks}</div>
                                    <div className="text-xs text-gray-400 mt-1">Total Tasks</div>
                                </div>
                                <div className="bg-gray-800/50 p-3 rounded text-center">
                                    <div className="text-2xl font-bold text-green-400">
                                        {(a.successRate * 100).toFixed(1)}%
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">Success Rate</div>
                                </div>
                                <div className="bg-gray-800/50 p-3 rounded text-center">
                                    <div className="text-2xl font-bold text-yellow-400">{t.responseTime}ms</div>
                                    <div className="text-xs text-gray-400 mt-1">Response Time</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
