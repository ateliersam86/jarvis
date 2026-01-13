'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/shared/Footer'
import { TerminalMockup } from '@/components/landing/TerminalMockup'
import { CopyInstallButton } from '@/components/landing/CopyInstallButton'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ArrowRight, Cpu, Globe, Shield } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

export default function LandingPage() {
  const t = useTranslations('Landing')
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  const yHero = useTransform(scrollYProgress, [0, 0.2], [0, -50])
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0])

  return (
    <div className="min-h-screen flex flex-col" ref={containerRef}>
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
            <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] mix-blend-screen" />
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <motion.div
              style={{ y: yHero, opacity: opacityHero }}
              className="text-center max-w-4xl mx-auto mb-16"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-primary mb-6">
                  {t('versionBadge')}
                </span>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                  Orchestrez vos <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">agents IA</span>
                  <br className="hidden md:block" />
                  depuis un seul terminal
                </h1>
                <p className="text-lg md:text-xl text-muted mb-8 max-w-2xl mx-auto leading-relaxed">
                  {t('heroDescription')}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/register">
                    <Button size="lg" className="w-full sm:w-auto text-base h-12 px-8">
                      {t('startBuilding')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/docs">
                    <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base h-12 px-8">
                      {t('readDocs')}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative mx-auto max-w-5xl"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-2xl blur opacity-20" />
              <TerminalMockup />
            </motion.div>
          </div>
        </section>

        {/* Trusted By */}
        <section className="py-12 border-y border-white/5 bg-white/[0.02]">
          <div className="container mx-auto px-4 md:px-6">
            <p className="text-center text-sm text-muted mb-8 font-medium">{t('trustedBy')}</p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <span className="text-xl font-bold text-white">Gemini</span>
              <span className="text-xl font-bold text-white">OpenAI</span>
              <span className="text-xl font-bold text-white">Anthropic</span>
              <span className="text-xl font-bold text-white">Mistral</span>
              <span className="text-xl font-bold text-white">Llama</span>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('featuresTitle')}</h2>
              <p className="text-muted max-w-2xl mx-auto">
                {t('featuresDescription')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-8">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <Cpu className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t('feature1Title')}</h3>
                <p className="text-muted leading-relaxed">
                  {t('feature1Desc')}
                </p>
              </Card>
              <Card className="p-8">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t('feature2Title')}</h3>
                <p className="text-muted leading-relaxed">
                  {t('feature2Desc')}
                </p>
              </Card>
              <Card className="p-8">
                <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-6 text-green-400">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{t('feature3Title')}</h3>
                <p className="text-muted leading-relaxed">
                  {t('feature3Desc')}
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
          <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-8">{t('ctaTitle')}</h2>
            <div className="flex justify-center">
              <CopyInstallButton />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}