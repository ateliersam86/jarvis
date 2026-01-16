'use client'

import { useState, useEffect } from 'react'
import { Link, usePathname } from '@/i18n/routing'
import { motion } from 'framer-motion'
import { Logo } from './Logo'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useTranslations } from 'next-intl'

export function Navbar() {
  const t = useTranslations('Nav')
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: t('features'), href: '/features' },
    { name: t('docs'), href: '/docs' },
    { name: t('dashboard'), href: '/dashboard' },
  ]

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-background/80 backdrop-blur-md border-b border-white/5 py-4" : "bg-transparent py-6"
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Logo />

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href ? "text-primary" : "text-muted"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          <Link href="/login">
            <Button variant="ghost" size="sm">{t('login')}</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm">{t('register')}</Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <LanguageSwitcher />
          <button
            className="text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-white/5 p-4 flex flex-col gap-4"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "text-base font-medium py-2 transition-colors",
                pathname === link.href ? "text-primary" : "text-muted"
              )}
            >
              {link.name}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">{t('login')}</Button>
            </Link>
            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full">{t('register')}</Button>
            </Link>
          </div>
        </motion.div>
      )}
    </header>
  )
}