import { useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { Check, X, Minus } from 'lucide-react';

type TranslatorFn = (key: string) => string;

type ComparisonSectionProps = {
  t: TranslatorFn;
};

type FeatureStatus = 'yes' | 'no' | 'partial';

interface ComparisonFeature {
  key: string;
  zfocus: FeatureStatus;
  screenTime: FeatureStatus;
  leechBlock: FeatureStatus;
}

const features: ComparisonFeature[] = [
  { key: 'easySetup', zfocus: 'yes', screenTime: 'yes', leechBlock: 'no' },
  { key: 'exceptionPattern', zfocus: 'yes', screenTime: 'no', leechBlock: 'partial' },
  { key: 'breakTime', zfocus: 'yes', screenTime: 'no', leechBlock: 'partial' },
  { key: 'hourlyLimit', zfocus: 'yes', screenTime: 'no', leechBlock: 'yes' },
  { key: 'specificUrlBlock', zfocus: 'yes', screenTime: 'no', leechBlock: 'partial' },
  { key: 'redirectOnExpiry', zfocus: 'yes', screenTime: 'no', leechBlock: 'yes' },
  { key: 'closeTab', zfocus: 'yes', screenTime: 'no', leechBlock: 'yes' },
  { key: 'activeTabOnly', zfocus: 'yes', screenTime: 'no', leechBlock: 'yes' },
  { key: 'schedule', zfocus: 'yes', screenTime: 'yes', leechBlock: 'yes' },
];

const StatusIcon = ({ status }: { status: FeatureStatus }) => {
  switch (status) {
    case 'yes':
      return (
        <div className="bg-accent/15 flex h-10 w-10 items-center justify-center rounded-full">
          <Check className="text-accent h-5 w-5" strokeWidth={3} />
        </div>
      );
    case 'no':
      return (
        <div className="bg-destructive/15 flex h-10 w-10 items-center justify-center rounded-full">
          <X className="text-destructive h-5 w-5" strokeWidth={3} />
        </div>
      );
    case 'partial':
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15">
          <Minus className="h-5 w-5 text-amber-500" strokeWidth={3} />
        </div>
      );
  }
};

export const ComparisonSection: React.FC<ComparisonSectionProps> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(frame, [0, 0.4 * fps], [20, 0], { extrapolateRight: 'clamp' });

  const tableOpacity = interpolate(frame, [0.3 * fps, 0.6 * fps], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div className="flex flex-col items-center justify-center px-6">
      <div
        className="mb-8 text-center"
        style={{
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
        }}>
        <h2 className="text-foreground mb-3 text-5xl font-bold tracking-tight">{t('comparison.title')}</h2>
        <p className="text-muted-foreground text-2xl">{t('comparison.subtitle')}</p>
      </div>

      <div
        className="border-border bg-card w-full max-w-4xl overflow-hidden rounded-2xl border-2"
        style={{ opacity: tableOpacity }}>
        <div className="bg-secondary/50 border-border grid grid-cols-4 border-b-2">
          <div className="text-muted-foreground p-4 text-xl font-semibold">{t('comparison.feature')}</div>
          <div className="border-border border-l-2 p-4 text-center">
            <div className="text-accent text-xl font-bold">ZFocus</div>
          </div>
          <div className="border-border border-l-2 p-4 text-center">
            <div className="text-muted-foreground text-lg font-medium">Screen Time</div>
            <div className="text-muted-foreground/60 text-sm">(Safari/iOS)</div>
          </div>
          <div className="border-border border-l-2 p-4 text-center">
            <div className="text-muted-foreground text-lg font-medium">LeechBlock NG</div>
          </div>
        </div>

        {features.map((feature, index) => {
          const rowOpacity = interpolate(frame, [0.4 * fps + index * 2, 0.6 * fps + index * 2], [0, 1], {
            extrapolateRight: 'clamp',
          });

          return (
            <div
              key={feature.key}
              className={`border-border grid grid-cols-4 border-b last:border-b-0 ${
                index % 2 === 0 ? 'bg-background' : 'bg-card/50'
              }`}
              style={{ opacity: rowOpacity }}>
              <div className="flex items-center p-4">
                <span className="text-foreground text-lg font-medium">
                  {t(`comparison.features.${feature.key}.title`)}
                </span>
              </div>
              <div className="border-border flex items-center justify-center border-l-2 p-3">
                <StatusIcon status={feature.zfocus} />
              </div>
              <div className="border-border flex items-center justify-center border-l-2 p-3">
                <StatusIcon status={feature.screenTime} />
              </div>
              <div className="border-border flex items-center justify-center border-l-2 p-3">
                <StatusIcon status={feature.leechBlock} />
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="mt-6 flex items-center justify-center gap-8"
        style={{
          opacity: interpolate(frame, [1.5 * fps, 1.8 * fps], [0, 1], { extrapolateRight: 'clamp' }),
        }}>
        <div className="flex items-center gap-3">
          <StatusIcon status="yes" />
          <span className="text-muted-foreground text-lg">{t('comparison.legend.yes')}</span>
        </div>
        <div className="flex items-center gap-3">
          <StatusIcon status="partial" />
          <span className="text-muted-foreground text-lg">{t('comparison.legend.partial')}</span>
        </div>
        <div className="flex items-center gap-3">
          <StatusIcon status="no" />
          <span className="text-muted-foreground text-lg">{t('comparison.legend.no')}</span>
        </div>
      </div>
    </div>
  );
};
