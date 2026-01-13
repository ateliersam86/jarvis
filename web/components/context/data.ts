export interface TaskItem {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  agent?: string;
}

export interface ChangelogItem {
  id: string;
  date: string;
  agent: string;
  description: string;
  type: 'feat' | 'fix' | 'chore' | 'docs';
}

export const MOCK_TASKS: TaskItem[] = [
  {
    id: '1',
    title: 'Refactor Dashboard to Dark Glassmorphism',
    status: 'done',
    priority: 'high',
    agent: 'Gemini'
  },
  {
    id: '2',
    title: 'Integrate AgentSummaryBar component',
    status: 'done',
    priority: 'medium',
    agent: 'Gemini'
  },
  {
    id: '3',
    title: 'Implement Context Tab with 3 sections',
    status: 'in-progress',
    priority: 'high',
    agent: 'Gemini'
  },
  {
    id: '4',
    title: 'Connect Quota API to Dashboard',
    status: 'todo',
    priority: 'medium',
    agent: 'Claude'
  },
  {
    id: '5',
    title: ' Optimize Mobile View for Dashboard',
    status: 'todo',
    priority: 'low',
    agent: 'ChatGPT'
  }
];

export const MOCK_CHANGELOG: ChangelogItem[] = [
  {
    id: 'c1',
    date: '2026-01-12',
    agent: 'Gemini',
    description: 'Integrate AgentSummaryBar and ProjectGrid into overview tab',
    type: 'feat'
  },
  {
    id: 'c2',
    date: '2026-01-12',
    agent: 'Gemini',
    description: 'Add quota bars, orchestrator status and global stats',
    type: 'feat'
  },
  {
    id: 'c3',
    date: '2026-01-12',
    agent: 'Gemini',
    description: 'Refactor DashboardClient to Dark Glassmorphism',
    type: 'feat'
  },
  {
    id: 'c4',
    date: '2026-01-11',
    agent: 'System',
    description: 'Initial commit of Jarvis AI Nexus',
    type: 'chore'
  }
];
