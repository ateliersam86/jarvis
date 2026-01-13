"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Terminal as TerminalIcon, Maximize2, Minimize2 } from "lucide-react";

interface InteractiveTerminalProps {
    initialMode?: "local" | "docker";
    containerId?: string;
    className?: string;
}

export default function InteractiveTerminal({ initialMode = "local", containerId = "", className = "" }: InteractiveTerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!terminalRef.current) return;

        let term: { dispose: () => void; write: (s: string) => void; focus: () => void; loadAddon: (a: unknown) => void; open: (el: HTMLElement) => void } | null = null;
        let ws: WebSocket | null = null;
        let fitAddon: { fit: () => void } | null = null;
        let handleResize: (() => void) | null = null;

        const initTerminal = async () => {
            try {
                const [xtermModule, fitAddonModule, attachAddonModule] = await Promise.all([
                    import("xterm"),
                    import("xterm-addon-fit"),
                    import("@xterm/addon-attach")
                ]);

                await import("xterm/css/xterm.css");

                const Terminal = xtermModule.Terminal;
                const FitAddon = fitAddonModule.FitAddon;
                const AttachAddon = attachAddonModule.AttachAddon;

                term = new Terminal({
                    cursorBlink: true,
                    fontSize: 14,
                    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                    theme: {
                        background: "#0f172a",
                        foreground: "#e2e8f0",
                        cursor: "#3b82f6",
                        selectionBackground: "rgba(59, 130, 246, 0.3)",
                        black: "#000000",
                        red: "#ef4444",
                        green: "#22c55e",
                        yellow: "#eab308",
                        blue: "#3b82f6",
                        magenta: "#a855f7",
                        cyan: "#06b6d4",
                        white: "#ffffff",
                    }
                });

                fitAddon = new FitAddon();
                term.loadAddon(fitAddon);
                term.open(terminalRef.current!);
                fitAddon.fit();
                setIsLoading(false);

                const wsUrl = `ws://${window.location.hostname}:4000?mode=${initialMode}&container=${containerId}`;
                ws = new WebSocket(wsUrl);

                const attachAddon = new AttachAddon(ws);
                term.loadAddon(attachAddon);

                ws.onopen = () => {
                    setIsConnected(true);
                    term?.write('\x1b[32m[CONNECTED]\x1b[0m Terminal ready.\r\n');
                    term?.focus();
                };

                ws.onclose = () => {
                    setIsConnected(false);
                    term?.write('\r\n\x1b[31m[DISCONNECTED]\x1b[0m Connection lost.\r\n');
                };

                ws.onerror = (err) => {
                    console.error("WS Error", err);
                    term?.write('\r\n\x1b[31m[ERROR]\x1b[0m Connection failed.\r\n');
                };

                handleResize = () => fitAddon?.fit();
                window.addEventListener('resize', handleResize);

            } catch (error) {
                console.error("Failed to load terminal:", error);
                setIsLoading(false);
            }
        };

        initTerminal();

        return () => {
            if (handleResize) window.removeEventListener('resize', handleResize);
            try { ws?.close(); } catch { }
            try { term?.dispose(); } catch { }
        };
    }, [initialMode, containerId]);

    return (
        <div className={`flex flex-col bg-slate-950 border border-white/10 rounded-lg overflow-hidden shadow-2xl transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50' : 'h-96'} ${className}`}>
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-mono text-slate-300 font-medium">
                        {initialMode === 'docker' ? `Docker: ${containerId}` : 'Local Shell'}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                </div>
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-white/5 rounded text-slate-400">
                    {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
            </div>

            <div className="flex-1 relative bg-[#0f172a] p-2">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                )}
                <div ref={terminalRef} className="h-full w-full" />
            </div>
        </div>
    );
}
