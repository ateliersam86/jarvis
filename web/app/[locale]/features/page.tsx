'use client'

import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/shared/Footer'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Zap, Brain, Globe, Shield, Activity, Cpu } from 'lucide-react'
import Image from 'next/image'

export default function FeaturesPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })

  const features = [
    {
      title: "Autonomous Agent Orchestration",
      description: "Don't just run prompts. Orchestrate complex workflows where agents collaborate, delegate tasks, and share context in real-time.",
      icon: Brain,
      color: "text-purple-400",
      image: "/dashboard_list_view.png" // Using existing assets as placeholder if available or generic
    },
    {
      title: "Distributed Shared Memory",
      description: "Agents aren't amnesiac. Jarvis provides a persistent, Redis-backed shared memory layer that allows context to survive across sessions and agents.",
      icon: Globe,
      color: "text-blue-400",
      image: "/dashboard_card_grouped.png"
    },
    {
      title: "Real-time Monitoring",
      description: "Watch your swarm think. The Live Dashboard gives you visibility into every thought process, tool execution, and token usage.",
      icon: Activity,
      color: "text-green-400",
      image: "/quickpick_mode.png"
    }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col" ref={containerRef}>
      <Navbar />

      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              Power Your AI Workforce
            </h1>
            <p className="text-lg text-muted leading-relaxed">
              Jarvis isn&apos;t just a chatbot wrapper. It&apos;s a complete operating system for autonomous agents, designed for production workloads.
            </p>
          </div>

          <div className="space-y-32">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-20`}
              >
                <div className="flex-1">
                  <div className={`w-12 h-12 rounded-xl bg-surface border border-white/5 flex items-center justify-center mb-6 ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">{feature.title}</h2>
                  <p className="text-muted text-lg leading-relaxed mb-8">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {[1, 2, 3].map((_, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm text-foreground/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Feature detail point {j + 1} for this section
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex-1 w-full">
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-border bg-surface/50 shadow-2xl shadow-black/50 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {/* Placeholder for image */}
                    <div className="w-full h-full flex items-center justify-center bg-white/5">
                      <span className="text-muted text-sm font-mono">Image: {feature.title}</span>
                      {/* If images exist, they would be here. Using text for now as specific assets might not match exact path */}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
