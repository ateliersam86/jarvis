'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Link } from '@/i18n/routing'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderOpen, Cpu, ListTodo, Settings, LogOut, Brain, User } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Logo } from '../shared/Logo'


interface SidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
    { icon: FolderOpen, label: 'Projects', href: '/dashboard/projects' },
    { icon: Cpu, label: 'AI Agents', href: '/dashboard/agents' },
    { icon: ListTodo, label: 'Tasks', href: '/dashboard/tasks' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ]

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.aside
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -280, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed left-0 top-0 bottom-0 w-64 border-r border-border bg-background/80 backdrop-blur-xl flex flex-col z-40"
        >
          <div className="p-6">
            <Logo />
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-4">
            {navItems.map((item, i) => {
              const isActive = pathname === item.href
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted hover:text-foreground hover:bg-surface-hover border border-transparent"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeDot"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                      />
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          <div className="p-4 mt-auto border-t border-border">
            <div className="bg-surface border border-border rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                  {session?.user?.name?.[0] || <User className="w-4 h-4" />}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold truncate text-foreground">{session?.user?.name || 'User'}</p>
                  <p className="text-xs text-muted truncate">{session?.user?.email || 'Pro Plan'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted hover:text-red-400 hover:bg-red-500/10 transition-all group"
            >
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium text-sm">Sign Out</span>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
