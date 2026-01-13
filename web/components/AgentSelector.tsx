'use client';

import { useState, useEffect } from 'react';

type Agent = {
    id: string;
    name: string;
    role: string;
    color: string;
    model: string;
};

// Colors mapping for Tailwind (must match seed colors roughly)
const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    violet: 'bg-violet-500/10 border-violet-500/30 text-violet-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
};

const hoverColorMap: Record<string, string> = {
    cyan: 'hover:bg-cyan-500/20 hover:border-cyan-500/50',
    emerald: 'hover:bg-emerald-500/20 hover:border-emerald-500/50',
    violet: 'hover:bg-violet-500/20 hover:border-violet-500/50',
    blue: 'hover:bg-blue-500/20 hover:border-blue-500/50',
};

type AgentStat = {
    agentId: string;
    name: string;
    role: string;
    color: string;
};

export default function AgentSelector({ onSelect }: { onSelect: (agent: Agent) => void }) {
    const [agents, setAgents] = useState<Agent[]>([]);

    useEffect(() => {
        // Fetch agents (we can just fetch stats and extract agents, or make a dedicated endpoint. 
        // For now we assume consistent seed or hardcode basic info if API fails, but let's try to fetch usages to get names)
        fetch('/api/agents/usage')
            .then(res => res.json())
            .then(data => {
                if (data.stats) {
                    setAgents(data.stats.map((s: AgentStat) => ({
                        id: s.agentId,
                        name: s.name,
                        role: s.role,
                        color: s.color, // DB color
                        model: 'TBD'
                    })));
                }
            });
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {agents.map((agent) => {
                const colorClass = colorMap[agent.color] || colorMap['cyan'];
                const hoverClass = hoverColorMap[agent.color] || hoverColorMap['cyan'];

                return (
                    <button
                        key={agent.id}
                        onClick={() => onSelect(agent)}
                        className={`flex items-center gap-4 p-4 rounded-xl border backdrop-blur-sm transition-all duration-300 text-left ${colorClass} ${hoverClass} group`}
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${colorClass.split(' ')[1]}`}>
                            <span className="text-xl font-bold">{agent.name[0]}</span>
                        </div>
                        <div>
                            <h3 className="font-mono text-lg font-bold">{agent.name}</h3>
                            <p className="text-xs opacity-70 uppercase tracking-wider">{agent.role}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
