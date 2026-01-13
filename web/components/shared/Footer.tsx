import { Logo } from "./Logo"
import { Link } from "@/i18n/routing"

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
            <Logo className="mb-4" />
            <p className="text-muted text-sm leading-relaxed">
              Advanced Multi-Agent Orchestration System designed for next-generation AI workflows.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Product</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              <li><Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Changelog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Resources</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="#" className="hover:text-primary transition-colors">Community</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Status</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Connect</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="#" className="hover:text-primary transition-colors">GitHub</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Twitter</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Discord</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Jarvis AI. All rights reserved.
          </p>
          <div className="flex gap-4">
            {/* Social Icons could go here */}
          </div>
        </div>
      </div>
    </footer>
  )
}
