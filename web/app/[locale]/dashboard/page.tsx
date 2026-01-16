'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { Header } from '@/components/dashboard/Header'
import { Stats } from '@/components/dashboard/Stats'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import ProjectGrid from '@/components/ProjectGrid'
import { Button } from '@/components/ui/Button'
import { Plus, ArrowUpRight, Brain } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

const FadeInView = ({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

export default function DashboardPage() {
    const { data: session } = useSession()
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const t = useTranslations('Dashboard')

    const actions = [
        { title: t('actions.deploy'), desc: t('actions.deployDesc'), cmd: 'jarvis deploy', color: 'bg-blue-500/10 text-blue-400' },
        { title: t('actions.logs'), desc: t('actions.logsDesc'), cmd: 'jarvis logs', color: 'bg-purple-500/10 text-purple-400' },
        { title: t('actions.auth'), desc: t('actions.authDesc'), cmd: 'jarvis auth', color: 'bg-green-500/10 text-green-400' },
    ]

    return (
        <div className="min-h-screen bg-background flex overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            <main className={cn("flex-1 flex flex-col min-w-0 overflow-y-auto transition-all duration-300", isSidebarOpen ? "md:ml-64" : "")}>
                <Header isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

                <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
                    {/* Welcome Section */}
                    <FadeInView className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight mb-2">
                                {t('title')}
                            </h1>
                            <p className="text-muted">
                                {t('welcome', { name: session?.user?.name?.split(' ')[0] || 'Commander' })}
                            </p>
                        </div>
                        <Link href="/dashboard/projects?new=true">
                            <Button className="shadow-lg shadow-primary/20">
                                <Plus className="w-4 h-4 mr-2" />
                                {t('newProject')}
                            </Button>
                        </Link>
                    </FadeInView>

                    {/* Stats */}
                    <FadeInView delay={0.1}>
                        <Stats />
                    </FadeInView>

                    {/* Projects & Activity Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-2 space-y-8">
                            {/* Recent Projects */}
                            <FadeInView delay={0.2}>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-semibold tracking-tight">{t('recentProjects')}</h2>
                                    <Link href="/dashboard/projects" className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1">
                                        {t('viewAll')} <ArrowUpRight className="w-3 h-3" />
                                    </Link>
                                </div>
                                <ProjectGrid />
                            </FadeInView>

                            {/* Quick Actions / Getting Started */}
                            <FadeInView delay={0.3}>
                                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 rounded-xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-5">
                                        <Brain className="w-24 h-24" />
                                    </div>
                                    <h2 className="text-lg font-semibold mb-4 relative z-10">{t('quickActions')}</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                                        {actions.map((action, i) => (
                                            <div key={i} className="bg-background/60 backdrop-blur border border-border rounded-lg p-4 hover:border-primary/30 transition-all cursor-pointer group">
                                                <div className="font-medium text-sm mb-1">{action.title}</div>
                                                <div className="text-xs text-muted mb-3">{action.desc}</div>
                                                <div className="text-[10px] font-mono bg-black/20 rounded px-2 py-1 text-muted/80 group-hover:text-primary transition-colors truncate">
                                                    {action.cmd}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </FadeInView>
                        </div>

                        <div className="xl:col-span-1">
                            <FadeInView delay={0.4} className="h-full">
                                <ActivityFeed />
                            </FadeInView>
                        </div>
                    </div>
                </div>

                <footer className="mt-auto py-6 text-center text-xs text-muted border-t border-border bg-background/30">
                     Jarvis Orchestrator v2.1.0 • <span className="text-green-500">{t('systemOnline')}</span>
                </footer>
            </main>
        </div>
    )
}