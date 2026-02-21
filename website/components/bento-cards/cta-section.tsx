'use client';

import { Button } from '@/components/ui/button';
import { Chrome, Download, TrendingUp, Star, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const CTASection = () => {
  const t = useTranslations();

  return (
    <div className="mx-auto max-w-7xl px-2 md:px-6">
      <div
        className="border-foreground/10 bg-foreground animate-bento-card-reveal gradient-border-hover group relative mx-auto max-w-7xl overflow-hidden rounded-2xl border p-10 px-2 text-center opacity-0 md:p-14 md:px-6"
        style={{ animationDelay: '700ms', animationFillMode: 'forwards' }}>
        {/* Subtle gradient overlay */}
        <div
          className="from-accent/[0.06] to-accent/[0.03] pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-3xl">
          <h2 className="text-primary-foreground mb-5 text-balance text-3xl font-bold md:text-4xl">{t('cta.title')}</h2>
          <div className="text-primary-foreground/60 mb-10 flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="text-accent h-4 w-4" />
              {t('cta.users')}
            </span>
            <span className="text-primary-foreground/20">|</span>
            <span>{t('cta.timeSaved')}</span>
            <span className="text-primary-foreground/20">|</span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-1">{t('cta.rating')}</span>
            </div>
          </div>

          <div className="mb-10 flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 gap-2 rounded-full px-7 text-base font-semibold shadow-[0_2px_16px_rgba(22,130,93,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(22,130,93,0.4)]">
              <Chrome className="h-5 w-5" />
              {t('cta.installChrome')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-12 gap-2 rounded-full bg-transparent px-7 text-base font-semibold transition-all duration-200">
              <Download className="h-4 w-4" />
              {t('cta.firefox')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-12 gap-2 rounded-full bg-transparent px-7 text-base font-semibold transition-all duration-200">
              <Download className="h-4 w-4" />
              {t('cta.manualDownload')}
            </Button>
          </div>

          <div className="text-primary-foreground/50 flex flex-wrap items-center justify-center gap-6 text-sm">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="text-accent h-4 w-4" />
              {t('cta.noRegistration')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
