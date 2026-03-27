import { useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { Check } from 'lucide-react';

type TranslatorFn = (key: string) => string;

type ComparisonSectionProps = {
  t: TranslatorFn;
};

const features = [
  'easySetup',
  'exceptionPattern',
  'breakTime',
  'hourlyLimit',
  'specificUrlBlock',
  'redirectOnExpiry',
  'closeTab',
  'activeTabOnly',
  'schedule',
];

export const ComparisonSection: React.FC<ComparisonSectionProps> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(frame, [0, 0.4 * fps], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <div className="flex flex-col items-center justify-center px-8">
      <div
        className="mb-10 text-center"
        style={{
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
        }}>
        <h2 className="text-foreground mb-3 text-4xl font-bold tracking-tight">{t('comparison.title')}</h2>
        <p className="text-muted-foreground text-xl">{t('comparison.subtitle')}</p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-2 gap-4">
        {features.map((feature, index) => {
          const itemOpacity = interpolate(frame, [0.3 * fps + index * 3, 0.6 * fps + index * 3], [0, 1], {
            extrapolateRight: 'clamp',
          });
          const itemX = interpolate(frame, [0.3 * fps + index * 3, 0.6 * fps + index * 3], [-20, 0], {
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={feature}
              className="bg-card border-border flex items-center gap-4 rounded-xl border p-5 shadow-sm"
              style={{
                opacity: itemOpacity,
                transform: `translateX(${itemX}px)`,
              }}>
              <div className="bg-accent/15 flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <Check className="text-accent h-5 w-5" strokeWidth={3} />
              </div>
              <span className="text-foreground text-lg font-medium">{t(`comparison.features.${feature}.title`)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
