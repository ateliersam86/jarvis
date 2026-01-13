'use client'

import { Search, Bell, Menu, X, Command } from 'lucide-react'
import { Button } from '../ui/Button'
import { Logo } from '../shared/Logo'

interface HeaderProps {
  isSidebarOpen: boolean
  toggleSidebar: () => void
}

export function Header({ isSidebarOpen, toggleSidebar }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 transition-all duration-300">
      <div className="flex items-center gap-4 flex-1">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleSidebar}
          className="text-muted hover:text-foreground"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>

        <div className="md:hidden">
          <Logo width={24} height={24} className="text-sm" />
        </div>

        <div className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search projects, tasks, or agents..."
            className="w-full bg-surface border border-border rounded-lg py-2 pl-10 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted/50 text-foreground"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-background/50 rounded border border-border text-[10px] text-muted font-mono">
            <Command className="w-2.5 h-2.5" /> K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-muted hover:text-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
        </Button>
      </div>
    </header>
  )
}
