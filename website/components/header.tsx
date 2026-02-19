'use client';

import { LanguageSelector } from './language-selector';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/navigation';
import { Chrome } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export const Header = () => {
  const t = useTranslations();
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-card/80 border-border/60 border-b shadow-[0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl'
          : 'bg-background/60 border-b border-transparent backdrop-blur-md'
      } `}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        {/* Logo */}
        <button
          type="button"
          className="animate-header-content-appear flex cursor-pointer items-center gap-2.5 border-none bg-transparent p-0"
          onClick={() => router.push('/')}>
          <div className="flex h-8 w-8 items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M250 460C170 420 80 340 80 180V100L250 40L420 100V180C420 340 330 420 250 460Z"
                fill="var(--card)"
                stroke="var(--accent)"
                strokeWidth="25"
                strokeLinejoin="round"
              />
              <path
                d="M200 200H300L200 300H300"
                stroke="var(--foreground)"
                strokeWidth="22"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-foreground text-lg font-semibold tracking-tight">ZFocus</span>
        </button>

        {/* Navigation */}
        <nav
          className="animate-header-content-appear hidden items-center gap-1 md:flex"
          role="navigation"
          aria-label="Main navigation">
          <Link
            href="/#features"
            className="link-hover-underline text-muted-foreground hover:text-foreground rounded-lg px-3.5 py-2 text-sm font-medium transition-colors">
            {t('nav.features')}
          </Link>
          <Link
            href="/faq"
            className="link-hover-underline text-muted-foreground hover:text-foreground rounded-lg px-3.5 py-2 text-sm font-medium transition-colors">
            {t('nav.faq')}
          </Link>
          <Link
            href="/use-cases"
            className="link-hover-underline text-muted-foreground hover:text-foreground rounded-lg px-3.5 py-2 text-sm font-medium transition-colors">
            {t('nav.useCases')}
          </Link>
          <Link
            href="/#pricing"
            className="link-hover-underline text-muted-foreground hover:text-foreground rounded-lg px-3.5 py-2 text-sm font-medium transition-colors">
            {t('nav.pricing')}
          </Link>
        </nav>

        {/* Actions */}
        <div className="animate-header-content-appear flex items-center gap-2.5">
          <LanguageSelector />
          <Button
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90 hidden h-9 gap-2 rounded-full px-4 text-sm font-semibold transition-colors sm:inline-flex">
            <Chrome className="h-3.5 w-3.5" />
            {t('cta.installChrome')}
          </Button>
        </div>
      </div>
    </header>
  );
};
