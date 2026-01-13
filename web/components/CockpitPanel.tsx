'use client';

import { Activity, Zap, Clock, RefreshCw, Lock, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { GOOGLE_OAUTH_CONFIG } from '@/lib/google/oauth-config';

// Types
export type Log = {
    source: string;
    type: string;
    payload: unknown;
    timestamp: number;
};

export type AgentUsage = {
    id: string;
    name: string;
    role: string;
    color: string;
    usage?: {
        dailyUsage: number;
        limit: number;
        resetTime: string;
        percentage: number;
        lastUpdated: string;
    };
};

type QuotaData = {
    models: Record<string, {
        displayName: string;
        quotaInfo: {
            remainingFraction: number;
            resetTime: string;
        };
        model?: string;
    }>;
};


export default function CockpitPanel({ logs, agents, onSelect }: { logs: Log[], agents: AgentUsage[], onSelect?: (name: string) => void }) {

    const [showAuthCodeInput, setShowAuthCodeInput] = useState(false);
    const [authCode, setAuthCode] = useState('');
    const [realQuota, setRealQuota] = useState<QuotaData | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const fetchRealQuota = async (code?: string, refreshToken?: string) => {
        try {
            const res = await fetch('/api/agents/quota/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, refreshToken })
            });
            const data = await res.json();

            if (data.error) {
                console.error('Quota fetch error:', data.error);
                if (refreshToken) localStorage.removeItem('jarvis_google_refresh_token');
                return;
            }

            if (data.quota) {
                setRealQuota(data.quota);
            }
            if (data.refreshToken) {
                localStorage.setItem('jarvis_google_refresh_token', data.refreshToken);
            }
        } catch {
            // ignore
        }
    };

    // Initial load of refresh token
    useEffect(() => {
        const storedRefreshToken = localStorage.getItem('jarvis_google_refresh_token');
        if (storedRefreshToken) {
            const timer = setTimeout(() => {
                void fetchRealQuota(undefined, storedRefreshToken);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, []);

    const startGoogleAuth = () => {
        const params = new URLSearchParams({
            client_id: GOOGLE_OAUTH_CONFIG.clientId,
            redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
            response_type: 'code',
            scope: GOOGLE_OAUTH_CONFIG.scopes.join(' '),
            access_type: 'offline',
            prompt: 'consent'
        });
        window.open(`${GOOGLE_OAUTH_CONFIG.authUrl}?${params.toString()}`, '_blank');
        setShowAuthCodeInput(true);
    };

    const handleAuthCodeSubmit = async () => {
        if (!authCode) return;
        setIsAuthenticating(true);
        await fetchRealQuota(authCode);
        setIsAuthenticating(false);
        setShowAuthCodeInput(false);
    };


    // Mapping from Extension Source (reactor.ts)
    // Indexes match between LABELS and IDS in the source.
    const QUOTA_MAPPINGS: Record<string, string[]> = {
        'CLAUDE': [
            'MODEL_PLACEHOLDER_M12', // Claude Opus 4.5 (Thinking)
            'MODEL_CLAUDE_4_5_SONNET',
            'MODEL_CLAUDE_4_5_SONNET_THINKING',
        ],
        'GEMINI': [
            'MODEL_PLACEHOLDER_M18', // Gemini 3 Flash
            'MODEL_PLACEHOLDER_M7',  // Gemini 3 Pro (High)
            'MODEL_PLACEHOLDER_M8',  // Gemini 3 Pro (Low)
            'MODEL_PLACEHOLDER_M9',  // Gemini 3 Pro Image
        ],
        'CHATGPT': [
            'MODEL_OPENAI_GPT_OSS_120B_MEDIUM', // Maps to GPT agent
        ]
    };

    const getRealQuotaForAgent = (agentName: string) => {
        if (!realQuota?.models) return null;
        const upperName = agentName.toUpperCase();

        // 1. Try explicit ID mapping
        const targetIds = QUOTA_MAPPINGS[upperName];
        if (targetIds) {
            for (const id of targetIds) {
                // The API returns models keyed by ID or similar
                const match = Object.values(realQuota.models).find(m => m.model === id || m.model === `models/${id}`);
                if (match) return match;
            }
        }

        // 2. Fallback to name/ID inclusion
        const lowerName = agentName.toLowerCase();
        return Object.values(realQuota.models).find(m => {
            const modelId = (m.model || '').toLowerCase();
            const displayName = (m.displayName || '').toLowerCase();

            if (lowerName.includes('gemini') && (modelId.includes('gemini') || displayName.includes('gemini'))) return true;
            if (lowerName.includes('claude') && (modelId.includes('claude') || displayName.includes('claude'))) return true;
            // GPT fallback
            if (lowerName.includes('chatgpt') && (modelId.includes('gpt') || displayName.includes('gpt'))) return true;

            return false;
        });
    };

    const getAgentLogs = (agent: string) => logs.filter(l => l.source.toLowerCase() === agent.toLowerCase() && l.type !== 'HEARTBEAT');

    const getStatus = (agent: string) => {
        const lastLog = logs.find(l => l.source === agent);
        if (!lastLog) return 'OFFLINE';
        const diff = now - lastLog.timestamp;
        if (Math.abs(diff) > 120000) return 'OFFLINE';
        if (lastLog.payload?.toString().includes('Thinking')) return 'BUSY';
        return 'ONLINE';
    };

    // Helper for large numbers
    const formatNumber = (n: number | undefined) => {
        if (!n) return '0';
        if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
        return n.toString();
    };

    return (
        <div className="flex flex-col gap-4 h-full overflow-y-auto pr-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Cockpit Monitor
                </h3>

                {/* Auth Button */}
                {!realQuota ? (
                    <button
                        onClick={startGoogleAuth}
                        className="flex items-center gap-2 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded hover:bg-zinc-800 transition-colors text-[10px] text-zinc-400"
                    >
                        <Lock className="w-3 h-3" />
                        Sync Quota
                    </button>
                ) : (
                    <div className="flex items-center gap-1 text-[10px] text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Live Sync</span>
                    </div>
                )}
            </div>

            {/* Auth Input Area */}
            {showAuthCodeInput && (
                <div className="p-3 bg-zinc-900/90 border border-yellow-500/30 rounded-lg animate-in slide-in-from-top-2">
                    <p className="text-[10px] text-zinc-400 mb-2 leading-relaxed">
                        <strong className="text-yellow-400">Important:</strong> Google will redirect you to a page that may say <span className="text-red-400">&quot;This site can&apos;t be reached&quot;</span>.
                        <br />
                        This is expected! Copy the <code>code=...</code> value from the URL bar of that broken page and paste it here:
                    </p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 bg-black border border-zinc-700 rounded px-2 py-1 text-xs font-mono text-green-400 focus:border-green-500 outline-none"
                            placeholder="Paste full URL or Code..."
                            value={authCode}
                            onChange={(e) => {
                                const val = e.target.value;
                                try {
                                    if (val.includes('code=')) {
                                        const url = new URL(val.startsWith('http') ? val : `http://dummy.com?${val}`);
                                        const code = url.searchParams.get('code');
                                        if (code) {
                                            setAuthCode(code);
                                            return;
                                        }
                                    }
                                } catch { /* ignore invalid url */ }
                                setAuthCode(val);
                            }}
                        />
                        <button
                            onClick={handleAuthCodeSubmit}
                            disabled={isAuthenticating}
                            className="bg-green-600 hover:bg-green-500 text-black px-3 py-1 rounded text-xs font-bold transition-colors"
                        >
                            {isAuthenticating ? '...' : 'Verify'}
                        </button>
                    </div>
                </div>
            )}

            {/* Agent Cards */}
            {agents
                .filter(a => a.name.toLowerCase() !== 'jarvis') // Hide Jarvis from Grid
                .map(agent => {
                    const status = getStatus(agent.name);
                    const realData = getRealQuotaForAgent(agent.name);

                    // Determine Visuals
                    const usageVal = realData
                        ? Math.round((1 - (realData.quotaInfo.remainingFraction || 0)) * 100)
                        : agent.usage?.percentage || 0;

                    const limitVal = realData ? 'API Limit' : formatNumber(agent.usage?.limit);
                    const resetVal = realData
                        ? new Date(realData.quotaInfo.resetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : (agent.usage?.resetTime ? new Date(agent.usage.resetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--');

                    // Color themes based on agent name
                    const colorStyles = agent.color === 'blue' ? 'from-cyan-500/10 to-blue-600/10 border-cyan-500/30 text-cyan-400' :
                        agent.color === 'orange' ? 'from-orange-500/10 to-red-600/10 border-orange-500/30 text-orange-400' :
                            agent.color === 'green' ? 'from-emerald-500/10 to-green-600/10 border-emerald-500/30 text-emerald-400' :
                                'from-violet-500/10 to-purple-600/10 border-violet-500/30 text-violet-400';

                    return (
                        <div
                            key={agent.id}
                            onClick={() => onSelect?.(agent.name)}
                            className={`relative group border rounded-xl overflow-hidden backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg bg-gradient-to-br cursor-pointer ${colorStyles}`}
                        >
                            {/* Status Dot */}
                            <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ring-2 ring-black/50 ${status === 'ONLINE' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' :
                                status === 'BUSY' ? 'bg-yellow-400 animate-pulse' : 'bg-red-500'
                                }`} />

                            <div className="p-4">
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg tracking-tight capitalize">{agent.name}</h4>
                                        <p className="text-[10px] opacity-60 uppercase tracking-wider font-semibold">
                                            {agent.role || 'AI Agent'}
                                        </p>
                                    </div>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-2 gap-2 mb-3 text-xs opacity-80">
                                    <div className="bg-black/20 rounded p-2 border border-white/5 relative overflow-hidden group/metric">
                                        <span className="block opacity-50 text-[9px] uppercase">Daily Usage</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="font-mono font-bold text-sm">
                                                {usageVal}%
                                            </span>
                                            <span className="text-[9px] opacity-50">of {limitVal}</span>
                                        </div>
                                        {/* Real Data Indicator */}
                                        {realData && (
                                            <div className="absolute top-1 right-1 text-yellow-500 opacity-50">
                                                <Zap className="w-2.5 h-2.5" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-black/20 rounded p-2 border border-white/5">
                                        <span className="block opacity-50 text-[9px] uppercase">Reset Time</span>
                                        <span className="font-mono font-bold text-sm flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {resetVal}
                                        </span>
                                    </div>
                                </div>

                                {/* Usage Bar */}
                                <div className="relative h-1.5 bg-black/40 rounded-full overflow-hidden mb-3">
                                    <div
                                        className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out ${usageVal > 90 ? 'bg-red-500 shadow-[0_0_10px_red]' :
                                            usageVal > 75 ? 'bg-yellow-500' : 'bg-current'
                                            }`}
                                        style={{ width: `${usageVal}%` }}
                                    />
                                </div>

                                {/* Logs Terminal */}
                                <div className="mt-2 font-mono text-[9px] opacity-60 space-y-1">
                                    {getAgentLogs(agent.name).length === 0 ? (
                                        <div className="italic opacity-30 text-center py-1">System Idle...</div>
                                    ) : (
                                        getAgentLogs(agent.name).slice(0, 3).map((log, i) => (
                                            <div key={i} className="truncate pl-2 border-l-2 border-white/10 flex items-center gap-1">
                                                <span className="opacity-50 text-[8px]">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                <span className="text-white/80">{log.payload?.toString() || 'Data...'}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

            <div className="text-[10px] text-center opacity-30 mt-2 flex items-center justify-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin duration-[10000ms]" /> Auto-Updating
            </div>
        </div>
    );
}