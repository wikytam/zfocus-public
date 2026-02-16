'use client';

import { Button } from '@/components/ui/button';
import { Check, Sparkles, Crown, Zap, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PricingTier {
  key: 'freeTrial' | 'yearly' | 'lifetime';
  icon: React.ReactNode;
  highlighted: boolean;
}

const tiers: PricingTier[] = [
  {
    key: 'freeTrial',
    icon: <Zap className="h-5 w-5" />,
    highlighted: false,
  },
  {
    key: 'yearly',
    icon: <Sparkles className="h-5 w-5" />,
    highlighted: true,
  },
  {
    key: 'lifetime',
    icon: <Crown className="h-5 w-5" />,
    highlighted: false,
  },
];

const featureKeys = {
  freeTrial: ['allFeatures', 'unlimitedBlocking', 'advancedSchedule', 'statistics', 'noCardRequired'],
  yearly: ['allFeatures', 'prioritySupport', 'earlyAccess', 'cloudSync', 'autoRenewal'],
  lifetime: ['allFeatures', 'lifetimeUpdates', 'prioritySupport', 'noRecurring', 'earlyAccess'],
};

export const PricingSection = () => {
  const t = useTranslations();

  return (
    <section id="pricing" className="scroll-mt-20 py-24">
      {/* Section header */}
      <div className="mb-16 text-center">
        <h2 className="text-foreground mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
          {t('pricing.title')}
        </h2>
        <p className="text-muted-foreground mx-auto max-w-2xl text-pretty text-lg">{t('pricing.subtitle')}</p>
      </div>

      {/* Pricing cards */}
      <div className="mx-auto grid max-w-5xl items-start gap-6 md:grid-cols-3">
        {tiers.map((tier, index) => {
          const features = featureKeys[tier.key];
          const isHighlighted = tier.highlighted;

          return (
            <div
              key={tier.key}
              className={`animate-bento-card-reveal group relative rounded-2xl border p-8 opacity-0 transition-all duration-300 ${
                isHighlighted
                  ? 'border-accent/30 bg-card scale-[1.02] shadow-[0_8px_40px_rgba(22,130,93,0.1)] md:scale-105'
                  : 'border-border bg-card card-hover-lift'
              } `}
              style={{
                animationDelay: `${index * 150}ms`,
                animationFillMode: 'forwards',
              }}>
              {/* Highlighted badge */}
              {isHighlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 rounded-full px-4 py-1 text-xs font-semibold shadow-[0_2px_12px_rgba(22,130,93,0.25)]">
                    <Sparkles className="h-3 w-3" />
                    {t(`pricing.${tier.key}.badge`)}
                  </span>
                </div>
              )}

              {/* Non-highlighted badge */}
              {!isHighlighted && (
                <div className="mb-6">
                  <span className="border-border bg-secondary text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
                    {t(`pricing.${tier.key}.badge`)}
                  </span>
                </div>
              )}

              {/* Header */}
              <div className={isHighlighted ? 'mt-4' : ''}>
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isHighlighted ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground'
                    } `}>
                    {tier.icon}
                  </div>
                  <h3 className="text-foreground text-xl font-semibold">{t(`pricing.${tier.key}.title`)}</h3>
                </div>

                {/* Price */}
                <div className="mb-2 flex items-baseline gap-1">
                  <span className="text-muted-foreground text-sm">{t(`pricing.${tier.key}.currency`)}</span>
                  <span className="text-foreground text-5xl font-bold tracking-tight">
                    {t(`pricing.${tier.key}.price`)}
                  </span>
                  <span className="text-muted-foreground ml-1 text-sm">{t(`pricing.${tier.key}.period`)}</span>
                </div>

                <p className="text-muted-foreground mb-8 text-sm">{t(`pricing.${tier.key}.description`)}</p>
              </div>

              {/* CTA Button */}
              <Button
                size="lg"
                className={`h-12 w-full cursor-pointer rounded-full text-base font-semibold transition-all duration-300 ${
                  isHighlighted
                    ? 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_2px_16px_rgba(22,130,93,0.3)] hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(22,130,93,0.4)]'
                    : 'bg-foreground text-background hover:bg-foreground/90'
                } `}>
                {t(`pricing.${tier.key}.cta`)}
              </Button>

              {/* Divider */}
              <div className="bg-border my-8 h-px" />

              {/* Features */}
              <ul className="space-y-3.5">
                {features.map(featureKey => (
                  <li key={featureKey} className="text-foreground/80 flex items-start gap-3 text-sm">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${isHighlighted ? 'text-accent' : 'text-accent/70'} `} />
                    <span>{t(`pricing.${tier.key}.features.${featureKey}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Guarantee */}
      <div className="mt-12 text-center">
        <div className="text-muted-foreground inline-flex items-center gap-2 text-sm">
          <Shield className="text-accent h-4 w-4" />
          {t('pricing.guarantee')}
        </div>
      </div>
    </section>
  );
};
