import { useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { Shield, Star, XCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

type TranslatorFn = (key: string) => string;

type SmartBlockingCardProps = {
  t: TranslatorFn;
};

const keywordExamples = [
  { prefix: 'example.com/', keyword: 'game', suffix: '/play' },
  { prefix: 'store.com/', keyword: 'shopping', suffix: '/cart' },
  { prefix: 'watch.com/', keyword: 'streaming', suffix: '/live' },
];

export const SmartBlockingCard: React.FC<SmartBlockingCardProps> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardScale = interpolate(frame, [0, 0.5 * fps], [0.95, 1], { extrapolateRight: 'clamp' });
  const cardOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div
      className="border-border bg-card relative overflow-hidden rounded-2xl border p-8"
      style={{
        transform: `scale(${cardScale})`,
        opacity: cardOpacity,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
      <div className="from-accent/[0.02] pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent" />

      <div className="relative z-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="from-accent/15 to-accent/5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br">
            <Shield className="text-accent h-6 w-6" />
          </div>
          <div>
            <h3 className="text-foreground text-2xl font-semibold">{t('smartBlocking.title')}</h3>
            <p className="text-muted-foreground text-base">{t('smartBlocking.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div
            style={{
              opacity: interpolate(frame, [0.3 * fps, 0.6 * fps], [0, 1], { extrapolateRight: 'clamp' }),
              transform: `translateY(${interpolate(frame, [0.3 * fps, 0.6 * fps], [15, 0], { extrapolateRight: 'clamp' })}px)`,
            }}>
            <div className="mb-3 flex items-center gap-2">
              <span className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium">
                <Star className="h-4 w-4" />
                {t('smartBlocking.exceptionPattern.badge')}
              </span>
              <h4 className="text-foreground text-lg font-medium">{t('smartBlocking.exceptionPattern.title')}</h4>
            </div>
            <div className="bg-secondary/60 border-border/80 space-y-3 rounded-xl border p-5 font-mono text-base">
              <div className="flex items-center gap-3">
                <XCircle className="text-destructive h-5 w-5 flex-shrink-0" />
                <span className="text-foreground">{t('smartBlocking.exceptionPattern.block')}</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-accent h-5 w-5 flex-shrink-0" />
                <span className="text-accent">{t('smartBlocking.exceptionPattern.allow1')}</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-accent h-5 w-5 flex-shrink-0" />
                <span className="text-accent">{t('smartBlocking.exceptionPattern.allow2')}</span>
              </div>
            </div>
            <p className="text-muted-foreground mt-3 text-sm">{t('smartBlocking.exceptionPattern.description')}</p>
          </div>

          <div
            style={{
              opacity: interpolate(frame, [0.6 * fps, 0.9 * fps], [0, 1], { extrapolateRight: 'clamp' }),
              transform: `translateY(${interpolate(frame, [0.6 * fps, 0.9 * fps], [15, 0], { extrapolateRight: 'clamp' })}px)`,
            }}>
            <h4 className="text-foreground mb-3 text-lg font-medium">{t('smartBlocking.keywordBlocking.title')}</h4>
            <div className="space-y-2">
              {keywordExamples.map((item, index) => (
                <div
                  key={item.keyword}
                  className="bg-background border-destructive/10 flex items-center gap-3 rounded-lg border p-3"
                  style={{
                    opacity: interpolate(frame, [0.7 * fps + index * 4, 0.9 * fps + index * 4], [0, 1], {
                      extrapolateRight: 'clamp',
                    }),
                    transform: `translateX(${interpolate(
                      frame,
                      [0.7 * fps + index * 4, 0.9 * fps + index * 4],
                      [20, 0],
                      {
                        extrapolateRight: 'clamp',
                      },
                    )}px)`,
                  }}>
                  <AlertTriangle className="text-destructive h-4 w-4 flex-shrink-0" />
                  <span className="text-foreground font-mono text-sm">
                    {item.prefix}
                    <span className="text-destructive font-bold">{item.keyword}</span>
                    {item.suffix}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground mt-2 text-xs">{t('smartBlocking.keywordBlocking.description')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
