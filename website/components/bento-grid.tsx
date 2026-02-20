'use client';

import { AdvancedActionsCard } from '@/components/bento-cards/advanced-actions-card';
import { CTASection } from '@/components/bento-cards/cta-section';
import { MoreThingsCard } from '@/components/bento-cards/more-things-card';
import { PrivacyCard } from '@/components/bento-cards/privacy-card';
import { SmartBlockingCard } from '@/components/bento-cards/smart-blocking-card';
import { TimeControlCard } from '@/components/bento-cards/time-control-card';
import { PricingSection } from '@/components/pricing-section';
import { Button } from '@/components/ui/button';
import { Chrome, Download } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export const BentoGrid = () => {
  const t = useTranslations();
  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* Hero Section */}
      <div className="relative">
        {/* Background gradient orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="bg-accent/[0.04] animate-float-orb absolute left-1/4 top-1/4 h-[400px] w-[400px] rounded-full blur-[80px]" />
          <div className="bg-accent/[0.03] animate-float-orb-delayed absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full blur-[60px]" />
        </div>

        <div
          className="animate-bento-header-reveal relative py-28 text-center opacity-0 md:py-36 lg:py-40"
          style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          {/* Headline */}
          <h1 className="text-foreground mb-6 text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            {t('hero.title')}
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground mx-auto max-w-2xl text-pretty text-lg leading-relaxed md:text-xl">
            {t('hero.subtitle')}
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 cursor-pointer gap-2 rounded-full px-7 text-base font-semibold shadow-[0_2px_12px_rgba(22,130,93,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(22,130,93,0.3)]">
              <Chrome className="h-5 w-5" />
              {t('cta.installChrome')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-border hover:bg-secondary hover:border-border h-12 cursor-pointer gap-2 rounded-full px-7 text-base font-semibold transition-all duration-300">
              <Download className="h-4 w-4" />
              {t('cta.firefox')}
            </Button>
          </div>

          {/* Trust indicators - browser icons */}
          <div className="mt-10 flex items-center justify-center gap-2">
            <span className="text-muted-foreground mr-2 text-xs">{t('moreThings.browserSupport.title')}:</span>
            <div className="flex items-center gap-2.5">
              {[
                { src: '/chrome-icon.svg', alt: 'Chrome' },
                { src: '/edge-icon.svg', alt: 'Edge' },
                { src: '/brave-icon.svg', alt: 'Brave' },
                { src: '/opera-icon.svg', alt: 'Opera' },
                { src: '/firefox-icon.svg', alt: 'Firefox' },
              ].map(browser => (
                <div
                  key={browser.alt}
                  className="bg-card border-border/60 browser-icon-hover flex h-7 w-7 items-center justify-center rounded-md border">
                  <Image src={browser.src} alt={browser.alt} width={16} height={16} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div id="features" className="grid scroll-mt-20 auto-rows-[minmax(200px,auto)] gap-4 pb-24 md:grid-cols-12">
        <SmartBlockingCard />
        <TimeControlCard />
        <AdvancedActionsCard />
        <PrivacyCard />
        <MoreThingsCard />
      </div>

      <PricingSection />

      <CTASection />
    </div>
  );
};
