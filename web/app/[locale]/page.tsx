'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/shared/Footer'
import { CopyInstallButton } from '@/components/landing/CopyInstallButton'
import { Button } from '@/components/ui/Button'
import { ArrowRight, Cpu, Globe, Shield } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

// Simple Analog Terminal Component
function AnalogTerminal() {
  return (
    <div className="w-full max-w-2xl mx-auto border-2 border-neutral-900 bg-white p-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between border-b-2 border-neutral-900 px-4 py-2 bg-neutral-100">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full border border-neutral-900 bg-white" />
          <div className="w-3 h-3 rounded-full border border-neutral-900 bg-white" />
        </div>
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-500">TERMINAL_01</div>
      </div>
      <div className="p-6 font-mono text-sm leading-relaxed text-neutral-800">
        <div className="mb-2">
          <span className="text-neutral-400">$</span> jarvis init --analog
        </div>
        <div className="mb-2 text-neutral-500">
          {'>'} Initializing analog precision protocol...
        </div>
        <div className="mb-2 text-neutral-500">
          {'>'} Loading serif fonts... <span className="text-[#FF3B30]">DONE</span>
        </div>
        <div className="mb-2 text-neutral-500">
          {'>'} Setting paper background... <span className="text-[#FF3B30]">DONE</span>
        </div>
        <div className="mt-4">
          <span className="text-neutral-400">$</span> _
          <motion.span
            animate={{ opacity: [0, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block w-2 h-4 bg-[#FF3B30] align-middle ml-1"
          />
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const t = useTranslations('Landing')
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  const yHero = useTransform(scrollYProgress, [0, 0.2], [0, -20])
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0.5])

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F3F0] text-neutral-900 font-sans selection:bg-[#FF3B30] selection:text-white" ref={containerRef}>
      {/* Navbar wrapper to force light text if needed or just placement */}
      <div className="relative z-50">
        <Navbar />
      </div>

      <main className="flex-1 overflow-hidden">
        {/* Grid Lines Background */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
          style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Hero Section */}
        <section className="relative pt-40 pb-24 md:pt-56 md:pb-40 z-10">
          <div className="container mx-auto px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

              {/* Left Column: Typography */}
              <div className="lg:col-span-7">
                <motion.div
                  style={{ y: yHero, opacity: opacityHero }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <div className="flex items-center gap-3 mb-8">
                    <span className="h-px w-12 bg-[#FF3B30]" />
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-500">{t('versionBadge')}</span>
                  </div>

                  <h1 className="text-6xl md:text-8xl font-serif font-medium tracking-tight mb-8 leading-[0.9] text-neutral-900">
                    {t.rich('heroTitle', {
                      highlight: (chunks) => <span className="text-[#FF3B30] italic font-normal ml-2">{chunks}</span>,
                      br: () => <br />
                    })}
                  </h1>

                  <p className="text-xl text-neutral-600 mb-12 max-w-xl leading-relaxed font-light border-l-2 border-neutral-200 pl-6">
                    {t('heroDescription')}
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <Link href="/register">
                      <Button size="lg" className="bg-[#FF3B30] hover:bg-[#D32F2F] text-white rounded-none h-14 px-10 text-lg font-medium tracking-wide shadow-none transition-transform active:translate-y-1">
                        {t('startBuilding')}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/docs">
                      <Button variant="ghost" size="lg" className="text-neutral-900 hover:bg-neutral-200 rounded-none h-14 px-8 text-lg font-medium border border-neutral-900">
                        {t('readDocs')}
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </div>

              {/* Right Column: Terminal */}
              <div className="lg:col-span-5">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  className="relative"
                >
                  <AnalogTerminal />
                  {/* Decorative Elements */}
                  <div className="absolute -z-10 top-12 -right-12 w-full h-full border-2 border-neutral-200" />
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted By - Minimalist */}
        <section className="py-16 border-y border-neutral-200 bg-white/50 backdrop-blur-sm z-10 relative">
          <div className="container mx-auto px-6 text-center">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-neutral-400 mb-8">{t('trustedBy')}</p>
            <div className="flex flex-wrap justify-center items-center gap-16 md:gap-24 opacity-40 hover:opacity-100 transition-opacity duration-500">
              {['Gemini', 'OpenAI', 'Anthropic', 'Mistral', 'Llama'].map((brand) => (
                <span key={brand} className="text-2xl font-serif font-bold text-neutral-900">{brand}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Features - Editorial Layout */}
        <section className="py-32 z-10 relative">
          <div className="container mx-auto px-6">
            <div className="mb-20">
              <h2 className="text-4xl md:text-5xl font-serif mb-6">{t('featuresTitle')}</h2>
              <div className="h-1 w-24 bg-[#FF3B30]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-neutral-200 pt-12">
              {[
                { icon: Cpu, title: 'feature1Title', desc: 'feature1Desc' },
                { icon: Globe, title: 'feature2Title', desc: 'feature2Desc' },
                { icon: Shield, title: 'feature3Title', desc: 'feature3Desc' }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group"
                >
                  <div className="mb-6 text-neutral-900">
                    <feature.icon strokeWidth={1.5} className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-medium mb-4 group-hover:text-[#FF3B30] transition-colors">{t(feature.title)}</h3>
                  <p className="text-neutral-500 leading-relaxed">
                    {t(feature.desc)}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA - Clean & Sharp */}
        <section className="py-32 bg-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FF3B30] to-orange-400" />
          <div className="container mx-auto px-6 text-center relative z-10">
            <h2 className="text-5xl md:text-7xl font-serif mb-12 tracking-tight text-neutral-900">
              {t('ctaTitle')}
            </h2>
            <div className="flex justify-center">
              <div className="bg-[#F4F3F0] p-2 border-2 border-neutral-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <CopyInstallButton />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
