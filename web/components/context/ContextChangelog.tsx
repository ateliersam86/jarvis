import { ChangelogItem } from './data';
import { GitCommit, User, Calendar, GitPullRequest } from 'lucide-react';

interface ContextChangelogProps {
  items: ChangelogItem[];
}

export default function ContextChangelog({ items }: ContextChangelogProps) {
  return (
    <div className="h-full bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
             <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <GitPullRequest className="w-5 h-5 text-blue-400" />
            </div>
             <div>
                <h3 className="text-sm font-bold text-slate-200">Changelog</h3>
                <p className="text-[10px] text-slate-500 font-mono">Recent modifications</p>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 relative">
            {/* Timeline Line */}
            <div className="absolute left-9 top-6 bottom-6 w-px bg-white/10" />

            <div className="space-y-8 relative">
                {items.map((item, _index) => (
                    <div key={item.id} className="relative pl-12 group">
                        {/* Dot */}
                        <div className="absolute left-[3px] top-1.5 w-7 h-7 bg-slate-900 border border-white/10 rounded-full flex items-center justify-center z-10 group-hover:border-blue-500/50 transition-colors">
                            <GitCommit className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                        </div>

                        {/* Content */}
                        <div className="bg-slate-800/40 border border-white/5 rounded-xl p-4 hover:bg-slate-800/60 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                <span className="font-mono text-xs text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 w-fit">
                                    {item.type}
                                </span>
                                <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {item.date}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {item.agent}
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}
