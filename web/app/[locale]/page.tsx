'use client'

import { motion } from 'framer-motion'
import { Navbar } from '@/components/shared/Navbar'
import { Footer } from '@/components/shared/Footer'
import { Button } from '@/components/ui/Button'
import { Settings, Cpu, Radio, Share2 } from 'lucide-react'
import { Link } from '@/i18n/routing'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F0] text-neutral-900 font-sans selection:bg-[#E85A2C] selection:text-white">
      <Navbar />

      <main className="flex flex-col">
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 px-6 md:px-12 lg:px-24 overflow-hidden">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Text Content */}
            <div className="space-y-8 z-10">
              <h1 className="text-5xl md:text-7xl font-serif leading-[1.1] tracking-tight">
                JARVIS: The Analog Soul of <span className="italic">AI Orchestration.</span>
              </h1>
              <p className="text-xl md:text-2xl text-neutral-600 font-light max-w-lg leading-relaxed">
                Intelligent systems. Human precision. Orchestrate the future with timeless clarity.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <Button 
                  className="bg-[#E85A2C] hover:bg-[#D44D25] text-white rounded-none px-8 py-6 text-lg tracking-wider font-medium shadow-lg transition-all"
                >
                  REQUEST ACCESS
                </Button>
                <div className="font-mono text-sm bg-neutral-200/50 px-4 py-3 rounded-none border border-neutral-300 text-neutral-700">
                  $ jarvis --orchestrate "workflows.ai" --mode analog
                </div>
              </div>
            </div>

            {/* Illustration - Vintage Machine / Steampunk Placeholder */}
            <div className="relative h-[500px] w-full bg-neutral-200 border-2 border-neutral-900 p-4 shadow-[12px_12px_0px_0px_rgba(24,24,27,1)] flex items-center justify-center overflow-hidden">
               {/* Abstract representation of a vintage machine */}
               <div className="absolute inset-0 bg-neutral-300 opacity-20"></div>
               <div className="relative z-10 text-center space-y-4">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="w-32 h-32 mx-auto border-4 border-neutral-800 rounded-full flex items-center justify-center"
                  >
                    <Settings className="w-20 h-20 text-neutral-800" />
                  </motion.div>
                  <div className="text-neutral-500 font-mono text-xs uppercase tracking-[0.2em]">Analog Processor Unit</div>
               </div>
               
               {/* Decorative elements */}
               <div className="absolute top-4 left-4 w-3 h-3 bg-neutral-900 rounded-full"></div>
               <div className="absolute top-4 right-4 w-3 h-3 bg-neutral-900 rounded-full"></div>
               <div className="absolute bottom-4 left-4 w-3 h-3 bg-neutral-900 rounded-full"></div>
               <div className="absolute bottom-4 right-4 w-3 h-3 bg-neutral-900 rounded-full"></div>
            </div>
          </div>
        </section>

        {/* PRECISION REDEFINED SECTION */}
        <section className="py-24 px-6 md:px-12 lg:px-24 border-t border-neutral-300">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-serif mb-16 text-center">Precision, Redefined</h2>
            
            <div className="grid md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center space-y-4 p-6 border border-transparent hover:border-neutral-300 transition-colors">
                <div className="w-16 h-16 bg-white border-2 border-neutral-900 flex items-center justify-center rounded-full shadow-[4px_4px_0px_0px_rgba(232,90,44,1)] mb-4">
                  <Share2 className="w-8 h-8 text-neutral-900" />
                </div>
                <h3 className="text-xl font-bold font-serif">Intelligent Routing</h3>
                <p className="text-neutral-600 leading-relaxed">Directs data streams with mechanical efficiency.</p>
              </div>

              <div className="flex flex-col items-center text-center space-y-4 p-6 border border-transparent hover:border-neutral-300 transition-colors">
                <div className="w-16 h-16 bg-white border-2 border-neutral-900 flex items-center justify-center rounded-full shadow-[4px_4px_0px_0px_rgba(232,90,44,1)] mb-4">
                  <Cpu className="w-8 h-8 text-neutral-900" />
                </div>
                <h3 className="text-xl font-bold font-serif">Modular Synthesis</h3>
                <p className="text-neutral-600 leading-relaxed">Components interlock with clockwork perfection.</p>
              </div>

              <div className="flex flex-col items-center text-center space-y-4 p-6 border border-transparent hover:border-neutral-300 transition-colors">
                <div className="w-16 h-16 bg-white border-2 border-neutral-900 flex items-center justify-center rounded-full shadow-[4px_4px_0px_0px_rgba(232,90,44,1)] mb-4">
                  <Radio className="w-8 h-8 text-neutral-900" />
                </div>
                <h3 className="text-xl font-bold font-serif">Tactile Feedback</h3>
                <p className="text-neutral-600 leading-relaxed">Feel the pulse of your operations.</p>
              </div>
            </div>
          </div>
        </section>

        {/* BLUEPRINT SECTION */}
        <section className="py-24 px-6 md:px-12 lg:px-24 bg-white border-y border-neutral-900">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
             {/* Flowchart Diagram Placeholder */}
             <div className="order-2 lg:order-1 relative bg-[#F5F5F0] p-8 border-2 border-neutral-900 h-96 flex items-center justify-center">
                <div className="absolute top-0 left-0 bg-neutral-900 text-white text-xs px-2 py-1 font-mono">FIG 2.1</div>
                
                {/* CSS Flowchart */}
                <div className="flex flex-col items-center gap-8 w-full max-w-sm transform scale-90 sm:scale-100">
                   <div className="w-32 h-12 border-2 border-neutral-800 flex items-center justify-center font-mono text-sm bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">INPUT</div>
                   <div className="h-8 w-px bg-neutral-800 relative after:content-[''] after:absolute after:bottom-0 after:-left-1 after:border-l-4 after:border-r-4 after:border-t-4 after:border-transparent after:border-t-neutral-800"></div>
                   <div className="grid grid-cols-2 gap-8 w-full">
                      <div className="border-2 border-neutral-800 p-2 text-center font-mono text-xs bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">PROCESS A</div>
                      <div className="border-2 border-neutral-800 p-2 text-center font-mono text-xs bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">PROCESS B</div>
                   </div>
                   <div className="h-8 w-px bg-neutral-800"></div>
                   <div className="w-32 h-12 border-2 border-neutral-800 rounded-full flex items-center justify-center font-mono text-sm bg-orange-100 shadow-[4px_4px_0px_0px_rgba(232,90,44,0.4)]">OUTPUT</div>
                </div>
             </div>

             {/* Quote and Text */}
             <div className="order-1 lg:order-2 space-y-8">
                <h2 className="text-4xl font-serif">The Blueprint for Intelligence</h2>
                <blockquote className="border-l-4 border-[#E85A2C] pl-6 py-2 italic text-2xl font-serif text-neutral-700 leading-normal">
                  "Jarvis isnt just software; its a philosophy of control. A masterful tool."
                </blockquote>
                <cite className="block text-neutral-500 font-mono text-sm uppercase tracking-widest not-italic">— Architectural Digest</cite>
             </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
