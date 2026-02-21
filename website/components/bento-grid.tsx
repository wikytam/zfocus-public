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
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="bg-accent/[0.04] animate-float-orb absolute left-1/4 top-1/4 h-[400px] w-[400px] rounded-full blur-[80px]" />
          <div className="bg-accent/[0.03] animate-float-orb-delayed absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full blur-[60px]" />
        </div>

        <div
          className="animate-bento-header-reveal relative grid items-center gap-10 py-20 opacity-0 sm:py-24 md:py-28 lg:grid-cols-2 lg:gap-14 lg:py-36"
          style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <div className="text-center lg:text-left">
            <h1 className="text-foreground mb-6 text-balance text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
              {t('hero.title')}
            </h1>

            <p className="text-muted-foreground mx-auto max-w-xl text-pretty text-base leading-relaxed sm:text-lg md:text-xl lg:mx-0">
              {t('hero.subtitle')}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10 lg:justify-start">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 h-11 cursor-pointer gap-2 rounded-full px-6 text-sm font-semibold shadow-[0_2px_12px_rgba(22,130,93,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(22,130,93,0.3)] sm:h-12 sm:px-7 sm:text-base">
                <Chrome className="h-5 w-5" />
                {t('cta.installChrome')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border hover:bg-secondary hover:border-border h-11 cursor-pointer gap-2 rounded-full px-6 text-sm font-semibold transition-all duration-300 sm:h-12 sm:px-7 sm:text-base">
                <Download className="h-4 w-4" />
                {t('cta.firefox')}
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 sm:mt-10 lg:justify-start">
              <span className="text-muted-foreground mr-2 text-xs">{t('moreThings.browserSupport.title')}:</span>
              <div className="flex items-center gap-2.5">
                {[
                  { src: '/icon/chrome-icon.svg', alt: 'Chrome' },
                  { src: '/icon/edge-icon.svg', alt: 'Edge' },
                  { src: '/icon/brave-icon.svg', alt: 'Brave' },
                  { src: '/icon/opera-icon.svg', alt: 'Opera' },
                  { src: '/icon/firefox-icon.svg', alt: 'Firefox' },
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

          <div className="relative mx-auto w-full max-w-xs pb-8 sm:max-w-sm md:max-w-md lg:mx-0 lg:max-w-none lg:pb-10">
            <div className="relative">
              <div className="bg-card border-border/60 overflow-hidden rounded-xl border shadow-xl sm:rounded-2xl">
                <Image
                  src="/overview-light.png"
                  alt="ZFocus overview - light mode"
                  width={800}
                  height={500}
                  className="block h-auto w-full dark:hidden"
                  priority
                />
                <Image
                  src="/overview-dark.png"
                  alt="ZFocus overview - dark mode"
                  width={800}
                  height={500}
                  className="hidden h-auto w-full dark:block"
                  priority
                />
              </div>

              <div className="bg-card border-border/60 absolute -bottom-4 left-0 w-24 overflow-hidden rounded-lg border shadow-lg sm:-bottom-5 sm:w-32 md:w-36 lg:-bottom-6 lg:-left-4 lg:w-44">
                <Image src="/pause.png" alt="ZFocus pause feature" width={400} height={300} className="h-auto w-full" />
              </div>
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
