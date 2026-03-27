import { useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { Check, Sparkles, Crown, Zap } from 'lucide-react';

type TranslatorFn = (key: string) => string;

type PricingSectionProps = {
  t: TranslatorFn;
};

interface PricingTier {
  key: 'freeTrial' | 'yearly' | 'lifetime';
  icon: React.ReactNode;
  highlighted: boolean;
  features: string[];
}

const tiers: PricingTier[] = [
  {
    key: 'freeTrial',
    icon: <Zap className="h-7 w-7" />,
    highlighted: false,
    features: [
      'urlBlocking',
      'exceptionPatterns',
      'keywordBlocking',
      'schedule',
      'timeLimits',
      'closeTabRedirect',
      'statistics',
      'noCardRequired',
    ],
  },
  {
    key: 'yearly',
    icon: <Sparkles className="h-7 w-7" />,
    highlighted: true,
    features: [
      'allFreeFeatures',
      'exceptionPatterns',
      'keywordBlocking',
      'prioritySupport',
      'chromeSync',
      'autoRenewal',
    ],
  },
  {
    key: 'lifetime',
    icon: <Crown className="h-7 w-7" />,
    highlighted: false,
    features: ['allYearlyFeatures', 'lifetimeUpdates', 'prioritySupport', 'noRecurring', 'earlyAccess'],
  },
];

export const PricingSection: React.FC<PricingSectionProps> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(frame, [0, 0.4 * fps], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div
        className="mb-10 text-center"
        style={{
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
        }}>
        <h2 className="text-primary-foreground mb-3 text-5xl font-bold tracking-tight">{t('pricing.title')}</h2>
        <p className="text-primary-foreground/60 text-2xl">{t('pricing.subtitle')}</p>
      </div>

      <div className="mx-auto grid w-full max-w-5xl grid-cols-3 gap-5">
        {tiers.map((tier, index) => {
          const isHighlighted = tier.highlighted;

          const cardOpacity = interpolate(frame, [0.3 * fps + index * 5, 0.6 * fps + index * 5], [0, 1], {
            extrapolateRight: 'clamp',
          });
          const cardY = interpolate(frame, [0.3 * fps + index * 5, 0.6 * fps + index * 5], [30, 0], {
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={tier.key}
              className={`relative rounded-2xl border p-6 ${
                isHighlighted
                  ? 'border-accent/40 bg-card scale-105 shadow-[0_8px_40px_rgba(22,130,93,0.2)]'
                  : 'border-border/30 bg-card/95'
              }`}
              style={{
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
              }}>
              {isHighlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-accent-foreground inline-flex w-max items-center justify-center gap-2 rounded-full px-4 py-2 text-lg font-bold shadow-lg">
                    <Sparkles className="h-5 w-5" />
                    {t(`pricing.${tier.key}.badge`)}
                  </span>
                </div>
              )}

              {!isHighlighted && (
                <div className="mb-4">
                  <span className="border-border bg-secondary text-muted-foreground inline-flex items-center gap-1 rounded-full border px-4 py-1.5 text-lg font-medium">
                    {t(`pricing.${tier.key}.badge`)}
                  </span>
                </div>
              )}

              <div className={isHighlighted ? 'mt-5' : ''}>
                <div className="mb-4 flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                      isHighlighted ? 'bg-accent/15 text-accent' : 'bg-secondary text-muted-foreground'
                    }`}>
                    {tier.icon}
                  </div>
                  <h3 className="text-foreground text-2xl font-bold">{t(`pricing.${tier.key}.title`)}</h3>
                </div>

                <div className="mb-4 flex items-baseline gap-1">
                  <span className="text-muted-foreground text-xl">{t(`pricing.${tier.key}.currency`)}</span>
                  <span className="text-foreground text-6xl font-bold tracking-tight">
                    {t(`pricing.${tier.key}.price`)}
                  </span>
                  <span className="text-muted-foreground ml-1 text-xl">{t(`pricing.${tier.key}.period`)}</span>
                </div>

                <p className="text-muted-foreground mb-5 text-lg leading-relaxed">
                  {t(`pricing.${tier.key}.description`)}
                </p>
              </div>

              <ul className="space-y-3">
                {tier.features.map(featureKey => (
                  <li key={featureKey} className="text-foreground/85 flex items-start gap-3 text-lg">
                    <Check className={`mt-0.5 h-6 w-6 shrink-0 ${isHighlighted ? 'text-accent' : 'text-accent/80'}`} />
                    <span>{t(`pricing.${tier.key}.features.${featureKey}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CTASection: React.FC<PricingSectionProps> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ctaOpacity = interpolate(frame, [2 * fps, 2.5 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const ctaY = interpolate(frame, [2 * fps, 2.5 * fps], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <div
      className="flex flex-col items-center justify-center px-4 text-center"
      style={{
        opacity: ctaOpacity,
        transform: `translateY(${ctaY}px)`,
      }}>
      <p className="text-primary-foreground/60 text-2xl">{t('cta.noRegistration')}</p>
    </div>
  );
};
