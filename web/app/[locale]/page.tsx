'use client'

import { motion } from 'framer-motion'
import { Link } from '@/i18n/routing'
import { 
  Terminal, 
  Cpu, 
  Activity, 
  Layers, 
  Settings, 
  Grid3X3,
  Globe,
  Zap,
  Box
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="h-screen w-full bg-[#F5F5F0] text-[#1a1a1a] overflow-hidden font-serif selection:bg-[#FF5500] selection:text-white">
      {/* Background Texture & Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
           style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}></div>
      <div className="absolute inset-0 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(#000000 1px, transparent 1px), linear-gradient(90deg, #000000 1px, transparent 1px)',
             backgroundSize: '40px 40px',
             opacity: 0.05
           }}></div>

      <div className="relative h-full w-full flex">
        
        {/* NAVIGATION RAIL (Fixed Left) */}
        <aside className="w-20 h-full border-r border-black/10 flex flex-col items-center py-8 z-20 bg-[#F5F5F0]/80 backdrop-blur-sm">
          <div className="w-10 h-10 border-2 border-[#1a1a1a] flex items-center justify-center mb-12">
            <span className="font-bold font-mono text-xl">J</span>
          </div>
          
          <nav className="flex-1 flex flex-col gap-8 w-full items-center">
            <Link href="/" className="group relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#FF5500] opacity-0 group-hover:opacity-10 transition-opacity rounded-md"></div>
              <Grid3X3 className="w-5 h-5 text-[#FF5500]" />
              <div className="absolute left-0 w-1 h-full bg-[#FF5500] rounded-r scale-y-0 group-hover:scale-y-100 transition-transform origin-center"></div>
            </Link>
            <button className="group relative w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-[#1a1a1a] transition-colors">
              <Layers className="w-5 h-5" />
            </button>
            <button className="group relative w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-[#1a1a1a] transition-colors">
              <Globe className="w-5 h-5" />
            </button>
          </nav>

          <div className="mt-auto flex flex-col gap-6 items-center">
             <div className="text-[10px] font-mono rotate-180 opacity-40" style={{ writingMode: 'vertical-rl' }}>
                v3.0.0-beta
             </div>
             <Settings className="w-5 h-5 text-neutral-400" />
          </div>
        </aside>

        {/* MAIN GRID LAYOUT */}
        <main className="flex-1 grid grid-cols-12 h-full">
          
          {/* SECTION LEFT: THE MANIFESTO (3 Columns) */}
          <section className="col-span-12 lg:col-span-3 border-r border-black/10 p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-50">
               <span className="font-mono text-xs border border-black px-2 py-0.5 rounded-full">SECTION A-1</span>
            </div>

            <div className="mt-20 space-y-2">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tighter leading-[0.9]">
                Why<br />
                <span className="italic font-serif">Jarvis?</span>
              </h1>
              <div className="w-12 h-1 bg-[#FF5500] mt-6 mb-8"></div>
            </div>

            <div className="relative z-10">
              <p className="text-lg leading-relaxed text-neutral-700 font-medium max-w-xs">
                In an era of digital noise, we return to the blueprint. 
                <span className="block mt-4 text-neutral-500 text-base font-normal">
                  Precision isn't just a metric; it's an aesthetic. Jarvis orchestrates your digital workforce with the elegance of a master architect.
                </span>
              </p>
            </div>

            <div className="hidden lg:block absolute bottom-8 right-8 opacity-10 pointer-events-none transform rotate-[-90deg] origin-bottom-right whitespace-nowrap text-9xl font-bold font-serif">
               MANIFESTO
            </div>
          </section>

          {/* SECTION CENTER: THE HEART (5 Columns) */}
          <section className="col-span-12 lg:col-span-6 border-r border-black/10 relative flex flex-col items-center justify-center p-8 overflow-hidden bg-[#F0F0EB]">
             
             {/* Decorative grid background specific to center */}
             <div className="absolute inset-0" 
                  style={{ 
                    backgroundImage: 'radial-gradient(#1a1a1a 0.5px, transparent 0.5px)', 
                    backgroundSize: '20px 20px', 
                    opacity: 0.1 
                  }}>
             </div>

             <div className="relative z-10 w-full max-w-2xl aspect-square flex items-center justify-center">
                
                {/* The "Console" Circle */}
                <motion.div 
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ duration: 1.2, ease: "easeOut" }}
                   className="relative w-[500px] h-[500px] rounded-full border border-black/20 flex items-center justify-center"
                >
                   {/* Orbiting Elements */}
                   <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border border-dashed border-black/10"
                   />
                   <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-40 rounded-full border border-dotted border-black/30"
                   />

                   {/* Central Core */}
                   <div className="relative z-20 flex flex-col items-center">
                      <h2 className="text-8xl font-serif tracking-widest text-[#1a1a1a] z-20 relative">JARVIS</h2>
                      <div className="text-[#FF5500] font-mono text-sm tracking-[0.5em] mt-2 uppercase">Orchestrator</div>
                   </div>

                   {/* Agents Nodes */}
                   {/* Gemini */}
                   <motion.div 
                      className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                   >
                      <div className="w-16 h-16 bg-white border border-black shadow-[4px_4px_0_0_#1a1a1a] flex items-center justify-center rounded-full z-10 relative">
                         <Zap className="w-6 h-6 text-[#1a1a1a]" />
                         <div className="absolute -bottom-8 left-1/2 w-px h-8 bg-black/20"></div>
                      </div>
                      <span className="font-mono text-xs bg-black text-white px-2 py-0.5">GEMINI</span>
                   </motion.div>

                   {/* Claude */}
                   <motion.div 
                      className="absolute bottom-10 left-10 flex flex-col items-center gap-2"
                      animate={{ y: [0, 10, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                   >
                      <div className="w-14 h-14 bg-white border border-black shadow-[4px_4px_0_0_#1a1a1a] flex items-center justify-center rounded-full z-10 relative">
                         <Box className="w-6 h-6 text-[#1a1a1a]" />
                      </div>
                      <span className="font-mono text-xs bg-white border border-black px-2 py-0.5">CLAUDE</span>
                   </motion.div>

                   {/* Codex */}
                   <motion.div 
                      className="absolute bottom-10 right-10 flex flex-col items-center gap-2"
                      animate={{ y: [0, 10, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                   >
                      <div className="w-14 h-14 bg-white border border-black shadow-[4px_4px_0_0_#1a1a1a] flex items-center justify-center rounded-full z-10 relative">
                         <Terminal className="w-6 h-6 text-[#1a1a1a]" />
                      </div>
                      <span className="font-mono text-xs bg-white border border-black px-2 py-0.5">CODEX</span>
                   </motion.div>

                </motion.div>
             </div>

             {/* Bottom Control Strip */}
             <div className="absolute bottom-0 left-0 w-full border-t border-black/10 p-4 flex justify-between items-center bg-[#F5F5F0]/90 font-mono text-xs text-neutral-500">
                <div className="flex gap-4">
                   <span>SYS: ONLINE</span>
                   <span className="text-[#FF5500]">● LIVE</span>
                </div>
                <div>
                   LATENCY: 12ms
                </div>
             </div>
          </section>

          {/* SECTION RIGHT: METRICS (4 Columns) */}
          <section className="col-span-12 lg:col-span-3 bg-[#F5F5F0] p-0 flex flex-col">
             
             {/* Header */}
             <div className="p-6 border-b border-black/10">
                <h3 className="font-mono text-sm uppercase tracking-widest text-neutral-400 mb-1">Live Telemetry</h3>
                <div className="text-2xl font-serif">System Metrics</div>
             </div>

             {/* Teletype Stream */}
             <div className="flex-1 overflow-hidden p-6 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-[#F5F5F0] via-transparent to-[#F5F5F0] pointer-events-none z-10 opacity-50"></div>
                <div className="font-mono text-xs space-y-3 text-neutral-600 opacity-80 h-full overflow-y-auto pb-20">
                   {[...Array(15)].map((_, i) => (
                      <div key={i} className="flex gap-3 items-start opacity-60 hover:opacity-100 transition-opacity cursor-default">
                         <span className="text-[#FF5500] min-w-[20px]">{`>`}</span>
                         <div>
                            <span className="block text-neutral-400 text-[10px]">10:24:{30 + i}</span>
                            <span className="block">Task executed: agent_swarm_{i+102} completed successfully.</span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             {/* Stats Cards */}
             <div className="border-t border-black/10 p-6 space-y-6 bg-white/50">
                
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Cpu className="w-5 h-5 text-neutral-400" />
                      <span className="font-mono text-xs">CPU LOAD</span>
                   </div>
                   <span className="font-mono font-bold text-lg">34%</span>
                </div>
                <div className="w-full bg-black/5 h-1">
                   <div className="bg-[#1a1a1a] h-full w-[34%]"></div>
                </div>

                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-neutral-400" />
                      <span className="font-mono text-xs">ACTIVE AGENTS</span>
                   </div>
                   <span className="font-mono font-bold text-lg">3/3</span>
                </div>

                <div className="pt-4 border-t border-dashed border-black/20">
                   <button className="w-full bg-[#1a1a1a] text-white font-mono text-xs uppercase py-3 hover:bg-[#FF5500] transition-colors">
                      Initialize System
                   </button>
                </div>
             </div>

          </section>

        </main>
      </div>
    </div>
  )
}
