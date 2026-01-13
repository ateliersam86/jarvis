import { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Circle, Clock, RefreshCw, User, ChevronDown, ChevronRight, ListTree, Plus, Github } from 'lucide-react';
import NewTaskModal from '../NewTaskModal';

/* --- TYPES --- */
interface BrainTask {
  id: string;
  content: string;
  completed: boolean;
  inProgress: boolean;
  depth: number;
  phase?: string;
  agent?: string;
  complexity?: string;
  model?: string;
}

interface SqlTask {
  id: string;
  title: string;
  status: string;
  priority: number;
  githubIssueId?: number;
  githubHtmlUrl?: string;
  createdAt: string;
}

interface TaskNode extends BrainTask {
  children: TaskNode[];
  // Computed status based on children for parents, or own status for leaves
  computedStatus: 'todo' | 'in-progress' | 'done';
  progressPct: number; // 0-100
}

interface ContextTasksProps {
  projectId?: string;
}

/* --- LOGIC: HIERARCHY BUILDER --- */
const buildHierarchy = (flatTasks: BrainTask[]): TaskNode[] => {
  const root: TaskNode[] = [];
  const stack: TaskNode[] = []; // Stack keeps track of parents at each depth

  // Assume flatTasks are reasonably ordered (parent comes before children)
  // If not, we might need a more complex robust parser, but standard markdown parsing usually preserves order.

  flatTasks.forEach(task => {
    const node: TaskNode = {
      ...task,
      children: [],
      computedStatus: task.completed ? 'done' : task.inProgress ? 'in-progress' : 'todo',
      progressPct: task.completed ? 100 : 0
    };

    // Find parent logic
    // We want the last node in stack with depth < task.depth
    while (stack.length > 0 && stack[stack.length - 1].depth >= task.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      // Top level node (for this subtree context, usually depth 0 or 1 depending on where list starts)
      root.push(node);
    } else {
      // Allow parent to adopt
      stack[stack.length - 1].children.push(node);
    }

    stack.push(node);
  });

  return root;
};

/* --- LOGIC: STATUS AGGREGATION --- */
// Returns [status, progressPct]
const computeAggregatedStatus = (node: TaskNode): ['todo' | 'in-progress' | 'done', number] => {
  if (node.children.length === 0) {
    // Leaf node: trust its own status
    const status = node.completed ? 'done' : node.inProgress ? 'in-progress' : 'todo';
    const pct = node.completed ? 100 : node.inProgress ? 50 : 0;
    return [status, pct];
  }

  // Parent node: aggregate children
  let allDone = true;
  let allTodo = true;
  let totalProgress = 0;

  node.children.forEach(child => {
    const [childStatus, childPct] = computeAggregatedStatus(child);

    // Update child with computed values (mutation for easier rendering later)
    child.computedStatus = childStatus;
    child.progressPct = childPct;

    if (childStatus !== 'done') allDone = false;
    if (childStatus !== 'todo') allTodo = false;

    totalProgress += childPct;
  });

  const avgProgress = totalProgress / node.children.length;

  let finalStatus: 'todo' | 'in-progress' | 'done' = 'in-progress';
  if (allDone) finalStatus = 'done';
  else if (allTodo) finalStatus = 'todo';

  // Override: If parent itself is marked done in raw data (e.g. manually checked despite children), respect it?
  // No, user requested "progress passe en done uniquement si la catégorie mere est validé" implying aggregation.
  // BUT the user also said "validé" which might mean the checkbox in MD.
  // Let's stick to aggregation for automation magic.

  node.computedStatus = finalStatus;
  node.progressPct = avgProgress;

  return [finalStatus, avgProgress];
};


export default function ContextTasks({ projectId }: ContextTasksProps) {
  const [brainTasks, setBrainTasks] = useState<BrainTask[]>([]);
  const [sqlTasks, setSqlTasks] = useState<SqlTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastModified, setLastModified] = useState<string | null>(null);
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({});
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  const fetchBrainTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/tasks/brain?filter=all`);
      const data = await res.json();

      if (!data.error) {
        setBrainTasks(data.tasks || []);
        setLastModified(data.lastModified || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSqlTasks = async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/tasks/list?projectId=${projectId}`);
      const data = await res.json();
      if (data.tasks) {
        setSqlTasks(data.tasks);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const refreshAll = () => {
    fetchBrainTasks();
    fetchSqlTasks();
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 10000);
    return () => clearInterval(interval);
  }, [projectId]);

  const togglePhase = (phase: string) => {
    setCollapsedPhases(prev => ({ ...prev, [phase]: !prev[phase] }));
  };

  // --- HIERARCHY PROCESSING ---
  const phaseGroups = useMemo(() => {
    const phases = Array.from(new Set(brainTasks.map(t => t.phase || 'Backlog')));
    return phases.map(phaseName => {
      const rawTasks = brainTasks.filter(t => (t.phase || 'Backlog') === phaseName);
      const roots = buildHierarchy(rawTasks);
      // Compute aggregation
      roots.forEach(root => computeAggregatedStatus(root));
      return { name: phaseName, roots };
    });
  }, [brainTasks]);


  /* --- RENDERERS --- */

  const getComplexityColor = (comp?: string) => {
    const lower = (comp || 'low').toLowerCase();
    if (lower === 'high' || lower === 'critical') return 'bg-red-500';
    if (lower === 'medium') return 'bg-orange-500';
    return 'bg-emerald-500';
  };

  const getAgentBadgeStyle = (agent?: string) => {
    const lower = (agent || '').toLowerCase();
    if (lower.includes('gemini')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (lower.includes('claude')) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    if (lower.includes('gpt')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  };


  // Subtask Renderer (Recursive or flat list for InProgress card)
  const renderSubtasks = (node: TaskNode) => {
    // Only show children logic
    if (!node.children || node.children.length === 0) return null;

    return (
      <div className="mt-2 space-y-1 pl-2 border-l border-white/10">
        {node.children.map(child => (
          <div key={child.id} className="flex items-start gap-2 text-xs text-slate-400">
            {child.computedStatus === 'done' ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-500/70 shrink-0 mt-0.5" />
            ) : child.computedStatus === 'in-progress' ? (
              <Clock className="w-3 h-3 text-blue-400 shrink-0 mt-0.5 animate-pulse" />
            ) : (
              <Circle className="w-3 h-3 text-slate-600 shrink-0 mt-0.5" />
            )}
            <span className={child.computedStatus === 'done' ? 'line-through opacity-50' : ''}>
              {child.content}
            </span>
          </div>
        ))}
      </div>
    );
  };


  const renderCard = (node: TaskNode, columnType: 'todo' | 'in-progress' | 'done') => {
    // Determine visuals
    const borderClass = node.computedStatus === 'in-progress' ? 'border-blue-500/30 ring-1 ring-blue-500/20' : 'border-white/5';
    const bgClass = node.computedStatus === 'in-progress' ? 'bg-slate-800/80 shadow-lg' : 'bg-slate-800/40 hover:bg-slate-800/60';

    return (
      <div key={node.id} className={`relative group transition-all rounded-lg mb-2 p-3 border ${borderClass} ${bgClass}`}>
        {/* Complexity Strip */}
        <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r ${getComplexityColor(node.complexity)} opacity-60 group-hover:opacity-100 transition-opacity`}></div>

        <div className="pl-3">
          <div className="flex justify-between items-start mb-1 gap-2">
            <p className={`text-sm font-medium leading-snug ${node.computedStatus === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
              {node.content}
            </p>
          </div>

          {/* Metadata Row */}
          <div className="flex flex-wrap gap-2 items-center mt-2">
            {node.agent && node.agent !== 'Auto' && (
              <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] border ${getAgentBadgeStyle(node.agent)}`}>
                <User className="w-3 h-3" />
                <span className="font-semibold">{node.agent}</span>
              </div>
            )}
            {/* Only show model/complexity on parent if relevant, or rely on children? Usually metadata is on the task itself. */}
          </div>

          {/* For In-Progress Column: Show Subtasks Aggregation */}
          {columnType === 'in-progress' && (
            <div className="mt-3 bg-black/20 rounded p-2">
              <div className="flex justify-between items-center text-[10px] uppercase text-slate-500 font-bold mb-1">
                <span>Progress</span>
                <span>{Math.round(node.progressPct)}%</span>
              </div>
              <div className="h-1 bg-slate-700 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${node.progressPct}%` }} />
              </div>
              {renderSubtasks(node)}
            </div>
          )}
        </div>
      </div>
    );
  };



  if (loading && brainTasks.length === 0 && sqlTasks.length === 0) {
    return <div className="flex items-center justify-center h-full"><RefreshCw className="w-6 h-6 text-blue-400 animate-spin" /></div>;
  }

  return (
    <div className="h-full flex flex-col bg-slate-950/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1 py-2 border-b border-white/5 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
            <ListTree className="w-5 h-5 text-purple-400" />
            Hierarchical Board
          </h2>
          {lastModified && <span className="text-[10px] text-slate-600 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(lastModified).toLocaleTimeString()}</span>}
        </div>
        <div className="flex items-center gap-2">
            {projectId && (
                <button 
                    onClick={() => setShowNewTaskModal(true)}
                    className="p-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                    title="New Task"
                >
                    <Plus className="w-4 h-4" />
                </button>
            )}
            <button onClick={refreshAll} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-slate-300">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>

      {/* SQL Tasks Section (Tracked) */}
      {sqlTasks.length > 0 && (
          <div className="mb-6 mx-1 border border-blue-500/20 rounded-xl bg-blue-900/5 overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-blue-900/20 border-b border-blue-500/10">
                  <h3 className="text-sm font-bold text-blue-200 uppercase tracking-wide flex items-center gap-2">
                      <Github className="w-4 h-4" /> Tracked Issues
                  </h3>
                  <span className="text-xs text-blue-400/50">({sqlTasks.length})</span>
              </div>
              <div className="p-3 space-y-2">
                  {sqlTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-slate-900/50 border border-white/5 rounded-lg hover:border-blue-500/30 transition-colors">
                          <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                              <span className="text-sm text-slate-200 font-medium">{task.title}</span>
                          </div>
                          <div className="flex items-center gap-3">
                              {task.githubHtmlUrl && (
                                  <a 
                                    href={task.githubHtmlUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                  >
                                      <Github className="w-3 h-3" />
                                      #{task.githubIssueId}
                                  </a>
                              )}
                              <span className="text-[10px] text-slate-500 uppercase">{task.status}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Kanban Swimlanes */}
      <div className="flex-1 overflow-y-auto px-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {phaseGroups.map(phase => {
          const isCollapsed = collapsedPhases[phase.name];

          // Filter Roots by Computed Status for Columns
          const todoRoots = phase.roots.filter(r => r.computedStatus === 'todo');
          const progressRoots = phase.roots.filter(r => r.computedStatus === 'in-progress');
          const doneRoots = phase.roots.filter(r => r.computedStatus === 'done');

          if (phase.roots.length === 0) return null;

          return (
            <div key={phase.name} className="mb-6 border border-white/5 rounded-xl bg-slate-900/20 overflow-hidden">
              {/* Swimlane Header */}
              <div
                onClick={() => togglePhase(phase.name)}
                className="flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-800/50 cursor-pointer transition-colors border-b border-white/5"
              >
                <div className="flex items-center gap-2">
                  {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">{phase.name}</h3>
                  <span className="text-xs text-slate-500 ml-2">({phase.roots.length} items)</span>
                </div>
                {/* Global Phase Progress */}
                {phase.roots.length > 0 && (
                  <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-purple-500/50"
                      style={{ width: `${(doneRoots.length / phase.roots.length) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/5 bg-slate-900/40">

                  {/* TO DO - Only unstarted parents */}
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-500 uppercase">
                      <Circle className="w-3 h-3" /> To Do
                    </div>
                    <div className="space-y-2">
                      {todoRoots.map(node => renderCard(node, 'todo'))}
                      {todoRoots.length === 0 && <div className="text-center py-8 text-slate-800 text-xs font-mono">All Started</div>}
                    </div>
                  </div>

                  {/* IN PROGRESS - Started parents + visual subtasks */}
                  <div className="p-3 bg-blue-500/5 border-x border-blue-500/10">
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold text-blue-400 uppercase">
                      <Clock className="w-3 h-3 animate-pulse" /> In Progress
                    </div>
                    <div className="space-y-2">
                      {progressRoots.map(node => renderCard(node, 'in-progress'))}
                      {progressRoots.length === 0 && <div className="text-center py-8 text-slate-800 text-xs font-mono">No Active Work</div>}
                    </div>
                  </div>

                  {/* DONE - Completed Parents */}
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-3 text-xs font-bold text-emerald-500/70 uppercase">
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </div>
                    <div className="space-y-2">
                      {doneRoots.map(node => renderCard(node, 'done'))}
                      {doneRoots.length === 0 && <div className="text-center py-8 text-slate-800 text-xs font-mono">Nothing Finished</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>
                    );
                  })}
                </div>
          
                {showNewTaskModal && projectId && (
                  <NewTaskModal 
                      projectId={projectId} 
                      onClose={() => setShowNewTaskModal(false)}
                      onCreated={refreshAll}
                  />
                )}
              </div>
            );
          }
          