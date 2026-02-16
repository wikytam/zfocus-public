'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export const Footer = () => {
  const t = useTranslations();

  return (
    <footer className="border-border bg-card border-t">
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Main footer content */}
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand column */}
          <div className="md:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              <span className="text-foreground font-semibold">ZFocus</span>
            </div>
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">{t('hero.subtitle')}</p>
          </div>

          {/* Quick links column */}
          <div className="md:col-span-1">
            <h4 className="text-foreground mb-4 text-sm font-semibold">{t('nav.features')}</h4>
            <nav className="flex flex-col gap-2.5" aria-label="Footer navigation">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground link-hover-underline w-fit text-sm transition-colors">
                {t('smartBlocking.title')}
              </a>
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground link-hover-underline w-fit text-sm transition-colors">
                {t('timeControl.title')}
              </a>
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground link-hover-underline w-fit text-sm transition-colors">
                {t('advancedActions.title')}
              </a>
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground link-hover-underline w-fit text-sm transition-colors">
                {t('privacy.title')}
              </a>
              <Link
                href="/faq"
                className="text-muted-foreground hover:text-foreground link-hover-underline w-fit text-sm transition-colors">
                {t('nav.faq')}
              </Link>
              <Link
                href="/use-cases"
                className="text-muted-foreground hover:text-foreground link-hover-underline w-fit text-sm transition-colors">
                {t('nav.useCases')}
              </Link>
            </nav>
          </div>

          {/* Download column */}
          <div className="md:col-span-1">
            <h4 className="text-foreground mb-4 text-sm font-semibold">{t('moreThings.browserSupport.title')}</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { src: '/chrome-icon.svg', alt: 'Chrome' },
                { src: '/edge-icon.svg', alt: 'Edge' },
                { src: '/brave-icon.svg', alt: 'Brave' },
                { src: '/opera-icon.svg', alt: 'Opera' },
                { src: '/firefox-icon.svg', alt: 'Firefox' },
              ].map(browser => (
                <span
                  key={browser.alt}
                  className="bg-secondary/60 border-border/80 hover:border-accent/20 hover:bg-muted browser-icon-hover flex h-10 w-10 items-center justify-center rounded-lg border"
                  aria-label={`Download for ${browser.alt}`}>
                  <Image src={browser.src} alt={browser.alt} width={20} height={20} />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-border mt-12 border-t pt-8">
          <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
            <p className="text-muted-foreground text-xs">{t('privacy.zeroTracking')}</p>
            <p className="text-muted-foreground text-xs">&copy; {new Date().getFullYear()} ZFocus</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
