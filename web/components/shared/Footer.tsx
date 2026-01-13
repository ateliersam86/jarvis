'use client'

import { Logo } from "./Logo"
import { Link } from "@/i18n/routing"
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('Footer')

  return (
    <footer className="border-t border-white/5 bg-background py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
          <div className="max-w-xs">
            <Logo className="mb-4" />
            <p className="text-muted text-sm leading-relaxed">
              {t('tagline')}
            </p>
          </div>

          <div className="flex gap-12">
            <div>
              <h3 className="font-semibold mb-4 text-foreground">{t('resources')}</h3>
              <ul className="space-y-2 text-sm text-muted">
                <li><Link href="/docs" className="hover:text-primary transition-colors">{t('docs')}</Link></li>
                <li><a href="https://github.com/ateliersam86/jarvis" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">{t('github')}</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Jarvis by Sam Sam
          </p>
          <p className="text-xs text-muted">
            🏔️❤️ En train de faire une côte, vive l'aventure 🏔️❤️
          </p>
        </div>
      </div>
    </footer>
  )
}
