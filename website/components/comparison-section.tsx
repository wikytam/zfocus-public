'use client';

import { Check, X, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useRef, useState } from 'react';

type FeatureStatus = 'yes' | 'no' | 'partial';

interface ComparisonFeature {
  key: string;
  zfocus: FeatureStatus;
  screenTime: FeatureStatus;
  leechBlock: FeatureStatus;
  footnote?: number;
}

const features: ComparisonFeature[] = [
  { key: 'easySetup', zfocus: 'yes', screenTime: 'yes', leechBlock: 'no', footnote: 1 },
  { key: 'exceptionPattern', zfocus: 'yes', screenTime: 'no', leechBlock: 'partial', footnote: 2 },
  { key: 'breakTime', zfocus: 'yes', screenTime: 'no', leechBlock: 'partial', footnote: 3 },
  { key: 'hourlyLimit', zfocus: 'yes', screenTime: 'no', leechBlock: 'yes', footnote: 4 },
  { key: 'specificUrlBlock', zfocus: 'yes', screenTime: 'no', leechBlock: 'partial', footnote: 5 },
  { key: 'redirectOnExpiry', zfocus: 'yes', screenTime: 'no', leechBlock: 'yes' },
  { key: 'closeTab', zfocus: 'yes', screenTime: 'no', leechBlock: 'yes' },
  { key: 'activeTabOnly', zfocus: 'yes', screenTime: 'no', leechBlock: 'yes' },
  { key: 'schedule', zfocus: 'yes', screenTime: 'yes', leechBlock: 'yes' },
  { key: 'modernUi', zfocus: 'yes', screenTime: 'yes', leechBlock: 'no', footnote: 6 },
  { key: 'statistics', zfocus: 'yes', screenTime: 'yes', leechBlock: 'partial', footnote: 7 },
  { key: 'privacyFirst', zfocus: 'yes', screenTime: 'partial', leechBlock: 'yes', footnote: 8 },
  { key: 'openSource', zfocus: 'yes', screenTime: 'no', leechBlock: 'yes', footnote: 9 },
  { key: 'crossBrowser', zfocus: 'yes', screenTime: 'no', leechBlock: 'yes', footnote: 10 },
];

const StatusIcon = ({ status }: { status: FeatureStatus }) => {
  switch (status) {
    case 'yes':
      return (
        <div className="bg-accent/10 flex h-7 w-7 items-center justify-center rounded-full">
          <Check className="text-accent h-4 w-4" strokeWidth={3} />
        </div>
      );
    case 'no':
      return (
        <div className="bg-destructive/10 flex h-7 w-7 items-center justify-center rounded-full">
          <X className="text-destructive h-4 w-4" strokeWidth={3} />
        </div>
      );
    case 'partial':
      return (
        <div className="bg-chart-4/10 flex h-7 w-7 items-center justify-center rounded-full">
          <Minus className="text-chart-4 h-4 w-4" strokeWidth={3} />
        </div>
      );
  }
};

const FootnoteRef = ({
  num,
  activeFootnote,
  onClick,
}: {
  num: number;
  activeFootnote: number | null;
  onClick: (num: number) => void;
}) => (
  <button
    type="button"
    onClick={() => onClick(num)}
    className={`text-accent hover:text-accent/80 ml-0.5 inline-flex cursor-pointer items-baseline text-[10px] font-semibold transition-colors ${
      activeFootnote === num ? 'text-accent underline' : ''
    }`}>
    <sup>{num}</sup>
  </button>
);

export const ComparisonSection = () => {
  const t = useTranslations('comparison');
  const [activeFootnote, setActiveFootnote] = useState<number | null>(null);
  const footnotesRef = useRef<HTMLDivElement>(null);

  const handleFootnoteClick = useCallback((num: number) => {
    setActiveFootnote(prev => (prev === num ? null : num));
    footnotesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const footnoteNumbers = features.filter(f => f.footnote).map(f => f.footnote!);

  return (
    <section id="comparison" className="mx-auto max-w-7xl scroll-mt-20 px-2 py-24 md:px-6">
      <div className="mb-16 text-center">
        <h2 className="text-foreground mb-4 text-balance text-3xl font-bold tracking-tight md:text-4xl">
          {t('title')}
        </h2>
        <p className="text-muted-foreground mx-auto max-w-2xl text-pretty text-lg">{t('subtitle')}</p>
      </div>

      {/* Desktop table */}
      <div className="mx-auto hidden max-w-4xl md:block">
        <div className="border-border overflow-hidden rounded-2xl border">
          {/* Header */}
          <div className="bg-card border-border grid grid-cols-4 border-b">
            <div className="text-muted-foreground p-5 text-sm font-medium">{t('feature')}</div>
            <div className="border-border border-l p-5 text-center">
              <div className="text-accent text-sm font-bold">ZFocus</div>
            </div>
            <div className="border-border border-l p-5 text-center">
              <div className="text-muted-foreground text-sm font-medium">Screen Time</div>
              <div className="text-muted-foreground/60 text-xs">(Safari/iOS)</div>
            </div>
            <div className="border-border border-l p-5 text-center">
              <div className="text-muted-foreground text-sm font-medium">LeechBlock NG</div>
            </div>
          </div>

          {/* Rows */}
          {features.map((feature, index) => (
            <div
              key={feature.key}
              className={`grid grid-cols-4 transition-colors ${
                index % 2 === 0 ? 'bg-background' : 'bg-card/50'
              } row-hover-highlight border-border border-b last:border-b-0`}>
              <div className="flex items-center p-5">
                <span className="text-foreground text-sm font-medium">
                  {t(`features.${feature.key}.title`)}
                  {feature.footnote && (
                    <FootnoteRef num={feature.footnote} activeFootnote={activeFootnote} onClick={handleFootnoteClick} />
                  )}
                </span>
              </div>
              <div className="border-border flex items-center justify-center border-l">
                <StatusIcon status={feature.zfocus} />
              </div>
              <div className="border-border flex items-center justify-center border-l">
                <StatusIcon status={feature.screenTime} />
              </div>
              <div className="border-border flex items-center justify-center border-l">
                <StatusIcon status={feature.leechBlock} />
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <StatusIcon status="yes" />
            <span className="text-muted-foreground text-xs">{t('legend.yes')}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon status="partial" />
            <span className="text-muted-foreground text-xs">{t('legend.partial')}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon status="no" />
            <span className="text-muted-foreground text-xs">{t('legend.no')}</span>
          </div>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden">
        <div className="space-y-3">
          {features.map(feature => (
            <div key={feature.key} className="border-border bg-card rounded-xl border p-4">
              <div className="text-foreground mb-3 text-sm font-medium">
                {t(`features.${feature.key}.title`)}
                {feature.footnote && (
                  <FootnoteRef num={feature.footnote} activeFootnote={activeFootnote} onClick={handleFootnoteClick} />
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1.5">
                  <StatusIcon status={feature.zfocus} />
                  <span className="text-accent text-[10px] font-semibold">ZFocus</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <StatusIcon status={feature.screenTime} />
                  <span className="text-muted-foreground text-[10px]">Screen Time</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <StatusIcon status={feature.leechBlock} />
                  <span className="text-muted-foreground text-[10px]">LeechBlock</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footnotes */}
      <div ref={footnotesRef} className="mx-auto mt-10 max-w-4xl space-y-0">
        {footnoteNumbers.map(num => (
          <button
            type="button"
            key={num}
            onClick={() => setActiveFootnote(prev => (prev === num ? null : num))}
            className={`border-border w-full cursor-pointer border-b text-left transition-all duration-300 last:border-b-0 ${
              activeFootnote === num ? 'bg-accent/5' : 'hover:bg-card/50'
            }`}>
            <div className="flex items-start gap-3 px-4 py-3">
              <span className="text-accent mt-0.5 flex-shrink-0 text-xs font-bold">{num}</span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-muted-foreground overflow-hidden text-xs leading-relaxed transition-all duration-300 ${
                    activeFootnote === num ? 'max-h-40 opacity-100' : 'max-h-5 opacity-70'
                  }`}>
                  {t(`footnotes.${num}`)}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};
