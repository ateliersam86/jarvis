'use client'

import { useState, ReactNode } from 'react'
import { Navbar } from '@/components/shared/Navbar'
import { CodeBlock } from '@/components/docs/CodeBlock'
import { cn } from '@/lib/utils'
import { Search, ChevronRight } from 'lucide-react'

interface TocItem {
  label: string
  href: string
}

interface SectionContent {
  group: string
  title: string
  content: ReactNode
  toc: TocItem[]
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started')

  const sidebarItems = [
    { 
      section: 'Introduction', 
      items: [
        { id: 'getting-started', label: 'Getting Started' },
        { id: 'concepts', label: 'Core Concepts' },
        { id: 'architecture', label: 'Architecture' },
      ]
    },
    { 
      section: 'Guides', 
      items: [
        { id: 'agents', label: 'Creating Agents' },
        { id: 'tasks', label: 'Task Orchestration' },
        { id: 'memory', label: 'Shared Memory' },
      ]
    },
    { 
      section: 'API Reference', 
      items: [
        { id: 'rest-api', label: 'REST API' },
        { id: 'sdk', label: 'Node.js SDK' },
        { id: 'cli', label: 'CLI Commands' },
      ]
    },
  ]

  const getSectionContent = (id: string): SectionContent => {
    switch (id) {
      case 'getting-started':
        return {
          group: 'Introduction',
          title: 'Getting Started',
          content: (
            <>
              <h1>Getting Started with Jarvis</h1>
              <p className="lead text-lg text-muted">
                Jarvis is a powerful orchestration engine for managing autonomous AI agents. This guide will help you set up your first swarm in minutes.
              </p>

              <h2>Installation</h2>
              <p>
                You can install the Jarvis CLI tool globally using npm or yarn. This will give you access to the `jarvis` command in your terminal.
              </p>
              <CodeBlock 
                language="bash" 
                code="npm install -g @jarvis/cli" 
              />

              <h2>Initializing a Project</h2>
              <p>
                Create a new directory for your project and initialize it. This will create a `jarvis.config.json` file and a basic directory structure.
              </p>
              <CodeBlock 
                language="bash" 
                code="mkdir my-swarm && cd my-swarm
jarvis init" 
              />

              <h2>Your First Agent</h2>
              <p>
                Define your first agent in `agents/researcher.ts`. Jarvis agents are built on top of standard LLM interfaces but enhanced with long-term memory and tool access.
              </p>
              <CodeBlock 
                language="typescript" 
                filename="agents/researcher.ts"
                code={`import { Agent } from '@jarvis/sdk'

export const researcher = new Agent({
  name: 'researcher',
  role: 'Information Gatherer',
  model: 'gemini-pro',
  tools: ['web-search', 'read-file'],
  instructions: 'You are an expert researcher. detailed and factual.'
})`} 
              />

              <h2>Running the Swarm</h2>
              <p>
                Start the orchestration engine to bring your agents to life.
              </p>
              <CodeBlock 
                language="bash" 
                code="jarvis start" 
              />
            </>
          ),
          toc: [
            { label: 'Installation', href: '#' },
            { label: 'Initializing a Project', href: '#' },
            { label: 'Your First Agent', href: '#' },
            { label: 'Running the Swarm', href: '#' },
          ]
        }
      default:
        // Generic fallback for other sections
        const group = sidebarItems.find(g => g.items.some(i => i.id === id))
        const item = group?.items.find(i => i.id === id)
        return {
          group: group?.section || 'Docs',
          title: item?.label || 'Documentation',
          content: (
            <>
              <h1>{item?.label}</h1>
              <p className="lead text-lg text-muted">
                Detailed documentation for <strong>{item?.label}</strong> is currently being written.
                Check back soon for updates.
              </p>
            </>
          ),
          toc: []
        }
    }
  }

  const activeData = getSectionContent(activeSection)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="container mx-auto px-4 md:px-6 flex-1 flex pt-24 pb-12">
        {/* Sidebar */}
        <aside className="w-64 hidden lg:block pr-8 border-r border-border shrink-0 fixed h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              type="text" 
              placeholder="Search docs..." 
              className="w-full bg-surface/50 border border-border rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-8">
            {sidebarItems.map((group) => (
              <div key={group.section}>
                <h3 className="font-semibold text-sm text-foreground mb-3">{group.section}</h3>
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveSection(item.id)}
                        className={cn(
                          "w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors",
                          activeSection === item.id 
                            ? "bg-primary/10 text-primary font-medium" 
                            : "text-muted hover:text-foreground hover:bg-surface"
                        )}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 lg:pl-72 lg:pr-64 max-w-none prose prose-invert prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-a:text-primary hover:prose-a:text-primary/80">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted">
            <span>Docs</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{activeData.group}</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{activeData.title}</span>
          </div>

          {activeData.content}
        </main>

        {/* Table of Contents */}
        <aside className="w-64 hidden xl:block pl-8 border-l border-border shrink-0 fixed right-0 top-24 h-[calc(100vh-6rem)]">
          {activeData.toc.length > 0 && (
            <>
              <h4 className="font-semibold text-sm mb-4 text-foreground">On this page</h4>
              <ul className="space-y-2 text-sm text-muted">
                {activeData.toc.map((item, i) => (
                  <li key={i}><a href={item.href} className="hover:text-primary transition-colors">{item.label}</a></li>
                ))}
              </ul>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
