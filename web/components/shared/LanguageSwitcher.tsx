'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { startTransition } from 'react';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const nextLocale = locale === 'fr' ? 'en' : 'fr';
    startTransition(() => {
        router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <Button
        variant="ghost"
        size="sm"
        onClick={toggleLanguage}
        className="w-12 h-8 px-1 rounded-full overflow-hidden border border-white/10 hover:border-primary/50 transition-colors flex items-center justify-center gap-0.5"
        title={t('language')}
    >
        <span className={cn("text-xs font-bold transition-colors", locale === 'en' ? "text-primary" : "text-muted-foreground/50")}>EN</span>
        <span className="text-[10px] text-white/20">|</span>
        <span className={cn("text-xs font-bold transition-colors", locale === 'fr' ? "text-primary" : "text-muted-foreground/50")}>FR</span>
    </Button>
  );
}
