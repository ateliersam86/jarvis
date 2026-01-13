'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { startTransition, useState, useRef, useEffect } from 'react';
import { locales, localeNames, localeFlags, Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export function LanguageSwitcher() {
  const t = useTranslations('Common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const switchLocale = (newLocale: Locale) => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
    setIsOpen(false);
    // Save preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-locale', newLocale);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm",
          "bg-white/5 border border-white/10 hover:border-primary/50 transition-all",
          isOpen && "border-primary/50"
        )}
        title={t('language')}
      >
        <span className="text-base">{localeFlags[locale]}</span>
        <span className="text-xs font-medium text-foreground hidden sm:inline">
          {locale.toUpperCase()}
        </span>
        <ChevronDown className={cn(
          "w-3 h-3 text-muted transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 py-1 w-40 bg-background/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                locale === loc
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-white/5"
              )}
            >
              <span className="text-base">{localeFlags[loc]}</span>
              <span className="font-medium">{localeNames[loc]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
