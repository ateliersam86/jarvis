"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { AttachAddon } from "@xterm/addon-attach";
import "xterm/css/xterm.css";
import { Loader2, Terminal as TerminalIcon, Maximize2, Minimize2 } from "lucide-react";

interface InteractiveTerminalProps {
    initialMode?: "local" | "docker";
    containerId?: string;
    className?: string;
}

export default function InteractiveTerminal({ initialMode = "local", containerId = "", className = "" }: InteractiveTerminalProps) {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (!terminalRef.current) return;

        // init xterm
        const term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: "#0f172a", // Slate-950
                foreground: "#e2e8f0", // Slate-200
                cursor: "#3b82f6",     // Blue-500
                selectionBackground: "rgba(59, 130, 246, 0.3)",
                black: "#000000",
                red: "#ef4444",
                green: "#22c55e",
                yellow: "#eab308",
                blue: "#3b82f6",
                magenta: "#a855f7",
                cyan: "#06b6d4",
                white: "#ffffff",
                brightBlack: "#475569",
                brightRed: "#f87171",
                brightGreen: "#4ade80",
                brightYellow: "#facc15",
                brightBlue: "#60abba",
                brightMagenta: "#c084fc",
                brightCyan: "#22d3ee",
                brightWhite: "#f8fafc"
            }
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();
        xtermRef.current = term;

        // Connect WS
        // const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // const host = window.location.hostname;
        // PTY Server is on port 4000. 
        // WARN: On Unraid/Production, we might need a reverse proxy /pty route.
        // For now, hardcode port 4000 or derive it.
        const wsUrl = `ws://${window.location.hostname}:4000?mode=${initialMode}&container=${containerId}`;

        console.log("Connecting to Shell:", wsUrl);
        const ws = new WebSocket(wsUrl);
        const attachAddon = new AttachAddon(ws);
        term.loadAddon(attachAddon);

        ws.onopen = () => {
            setIsConnected(true);
            term.write('\x1b[32m[CONNECTED]\x1b[0m Terminal ready.\r\n');
            term.focus();
        };

        ws.onclose = () => {
            setIsConnected(false);
            term.write('\r\n\x1b[31m[DISCONNECTED]\x1b[0m Connection lost.\r\n');
        };

        ws.onerror = (err) => {
            console.error("WS Error", err);
            term.write('\r\n\x1b[31m[ERROR]\x1b[0m Connection failed. Ensure pty-server is running on port 4000.\r\n');
        };

        socketRef.current = ws;

        // Handle Resize
        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            try {
                ws.close();
            } catch { }
            term.dispose();
        };
    }, [initialMode, containerId]);

    return (
        <div className={`flex flex-col bg-slate-950 border border-white/10 rounded-lg overflow-hidden shadow-2xl transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50' : 'h-96'} ${className}`}>

            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-white/5 handle cursor-move">
                <div className="flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-mono text-slate-300 font-medium">
                        {initialMode === 'docker' ? `Docker: ${containerId}` : 'Local Shell'}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors">
                        {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* Terminal View */}
            <div className="flex-1 relative bg-[#0f172a] p-2">
                {!isConnected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                )}
                <div ref={terminalRef} className="h-full w-full" />
            </div>
        </div>
    );
}
