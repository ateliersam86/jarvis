import { FileText, Database } from 'lucide-react';

interface ContextMemoryProps {
  memory: string | object;
}

export default function ContextMemory({ memory }: ContextMemoryProps) {
  const content = typeof memory === 'string' 
    ? memory 
    : JSON.stringify(memory, null, 2) || 'No project memory found.';

  return (
    <div className="h-full flex flex-col">
       <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl flex-1 overflow-hidden flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <Database className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-200">Project Memory</h3>
                    <p className="text-[10px] text-slate-500 font-mono">Synced from .memory/PROJECT_MEMORY.md</p>
                </div>
            </div>
            <div className="flex gap-2">
                 <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/40 border border-white/5 text-[10px] text-slate-400 font-mono">
                    <FileText className="w-3 h-3" />
                    <span>Read-Only</span>
                 </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50">
            <div className="prose prose-invert prose-sm max-w-none">
                <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-transparent border-none p-0">
                    {content}
                </pre>
            </div>
        </div>
       </div>
    </div>
  );
}
