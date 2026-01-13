'use client'

import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/shared/Footer'
import { motion } from 'framer-motion'
import { useRef } from 'react'
import { Zap, Brain, BarChart3, Users, Terminal, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function FeaturesPage() {
  const t = useTranslations('Features')
  const containerRef = useRef<HTMLDivElement>(null)

  const features = [
    {
      title: "Délégation Intelligente",
      description: "Jarvis analyse votre demande et choisit automatiquement le meilleur agent pour la tâche : Gemini pour l'UI, Claude pour la logique, Codex pour les tests.",
      icon: Brain,
      color: "text-purple-400",
      details: [
        "Analyse automatique du type de tâche",
        "Sélection de l'agent optimal selon ses forces",
        "Fallback automatique si un agent échoue",
      ]
    },
    {
      title: "Mode Swarm (Parallélisation)",
      description: "Décomposez automatiquement une tâche complexe en sous-tâches exécutées par plusieurs agents simultanément.",
      icon: Users,
      color: "text-blue-400",
      details: [
        "Décomposition automatique des tâches",
        "Exécution parallèle sur plusieurs agents",
        "Agrégation intelligente des résultats",
      ]
    },
    {
      title: "Suivi des Quotas en Temps Réel",
      description: "Visualisez votre consommation Gemini, Claude et OpenAI. Plus de surprises sur vos factures API.",
      icon: BarChart3,
      color: "text-green-400",
      details: [
        "Quotas Gemini, Claude, OpenAI",
        "Alertes avant épuisement",
        "Historique de consommation",
      ]
    },
    {
      title: "Interface en Langage Naturel",
      description: "Parlez simplement. Décrivez ce que vous voulez accomplir et Jarvis s'occupe du reste.",
      icon: Terminal,
      color: "text-cyan-400",
      details: [
        "Pas de commandes complexes à retenir",
        "Décrivez vos besoins naturellement",
        "Jarvis comprend et orchestre",
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col" ref={containerRef}>
      <Navbar />

      <main className="flex-1 pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              Fonctionnalités
            </h1>
            <p className="text-lg text-muted leading-relaxed">
              Jarvis n'est pas un simple wrapper de chatbot. C'est un orchestrateur multi-agents conçu pour maximiser l'efficacité de vos CLIs d'IA.
            </p>
          </div>

          <div className="space-y-24">
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
                  <div className={`w-14 h-14 rounded-xl bg-surface border border-white/10 flex items-center justify-center mb-6 ${feature.color}`}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">{feature.title}</h2>
                  <p className="text-muted text-lg leading-relaxed mb-8">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.details.map((detail, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm text-foreground/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex-1 w-full">
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-surface/80 to-surface/40 shadow-2xl shadow-black/50 group p-8 flex items-center justify-center">
                    <feature.icon className={`w-24 h-24 ${feature.color} opacity-30`} />
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
