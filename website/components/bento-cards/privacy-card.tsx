'use client';

import { Lock, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const PrivacyCard = () => {
  const t = useTranslations();

  return (
    <div
      className="border-border bg-card card-hover-lift hover:border-accent/30 animate-bento-card-reveal group relative overflow-hidden rounded-2xl border p-6 opacity-0 md:col-span-6 md:p-8 lg:col-span-5"
      style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
      {/* Subtle gradient overlay */}
      <div
        className="from-foreground/[0.01] pointer-events-none absolute inset-0 bg-gradient-to-b to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-5 flex items-center gap-3">
          <div className="bg-foreground text-primary-foreground icon-hover-glow flex h-10 w-10 items-center justify-center rounded-xl shadow-sm">
            <Lock className="icon-hover-spin h-5 w-5" />
          </div>
          <div>
            <h3 className="text-foreground text-lg font-semibold">{t('privacy.title')}</h3>
            <p className="text-muted-foreground text-sm">{t('privacy.subtitle')}</p>
          </div>
        </div>

        <div className="my-4 flex flex-1 items-center justify-center">
          <div className="relative">
            <div className="bg-accent/[0.06] absolute inset-0 rounded-full blur-2xl" aria-hidden="true" />
            <div className="from-accent/10 to-accent/[0.04] border-accent/15 lock-hover-float relative flex h-24 w-24 items-center justify-center rounded-full border bg-gradient-to-br">
              <Lock className="text-accent h-12 w-12" />
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 text-sm">
            <CheckCircle2 className="text-accent h-4 w-4 flex-shrink-0" />
            <span className="text-foreground font-medium">{t('privacy.localStorage')}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <CheckCircle2 className="text-accent h-4 w-4 flex-shrink-0" />
            <span className="text-foreground font-medium">{t('privacy.zeroTracking')}</span>
          </div>
        </div>

        <div className="border-border mt-5 border-t pt-4">
          <p className="text-muted-foreground text-center text-sm italic leading-relaxed">
            {'"'}
            {t('privacy.quote')}
            {'"'}
          </p>
        </div>
      </div>
    </div>
  );
};
