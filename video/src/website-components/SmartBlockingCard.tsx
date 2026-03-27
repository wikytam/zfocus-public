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
      className="border-border bg-card relative overflow-hidden rounded-3xl border-2 p-12"
      style={{
        transform: `scale(${cardScale})`,
        opacity: cardOpacity,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
      <div className="from-accent/[0.02] pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent" />

      <div className="relative z-10">
        <div className="mb-10 flex items-center gap-5">
          <div className="from-accent/15 to-accent/5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br">
            <Shield className="text-accent h-10 w-10" />
          </div>
          <div>
            <h3 className="text-foreground text-5xl font-bold">{t('smartBlocking.title')}</h3>
            <p className="text-muted-foreground text-2xl">{t('smartBlocking.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-8">
          <div
            style={{
              opacity: interpolate(frame, [0.3 * fps, 0.6 * fps], [0, 1], { extrapolateRight: 'clamp' }),
              transform: `translateY(${interpolate(frame, [0.3 * fps, 0.6 * fps], [15, 0], { extrapolateRight: 'clamp' })}px)`,
            }}>
            <div className="mb-5 flex items-center gap-4">
              <span className="bg-accent text-accent-foreground inline-flex items-center gap-2 rounded-full px-5 py-2 text-xl font-semibold">
                <Star className="h-6 w-6" />
                {t('smartBlocking.exceptionPattern.badge')}
              </span>
              <h4 className="text-foreground text-3xl font-semibold">{t('smartBlocking.exceptionPattern.title')}</h4>
            </div>
            <div className="bg-secondary/60 border-border/80 space-y-5 rounded-2xl border p-8 font-mono text-2xl">
              <div className="flex items-center gap-5">
                <XCircle className="text-destructive h-8 w-8 flex-shrink-0" />
                <span className="text-foreground">{t('smartBlocking.exceptionPattern.block')}</span>
              </div>
              <div className="flex items-center gap-5">
                <CheckCircle2 className="text-accent h-8 w-8 flex-shrink-0" />
                <span className="text-accent">{t('smartBlocking.exceptionPattern.allow1')}</span>
              </div>
              <div className="flex items-center gap-5">
                <CheckCircle2 className="text-accent h-8 w-8 flex-shrink-0" />
                <span className="text-accent">{t('smartBlocking.exceptionPattern.allow2')}</span>
              </div>
            </div>
            <p className="text-muted-foreground mt-5 text-xl">{t('smartBlocking.exceptionPattern.description')}</p>
          </div>

          <div
            style={{
              opacity: interpolate(frame, [0.6 * fps, 0.9 * fps], [0, 1], { extrapolateRight: 'clamp' }),
              transform: `translateY(${interpolate(frame, [0.6 * fps, 0.9 * fps], [15, 0], { extrapolateRight: 'clamp' })}px)`,
            }}>
            <h4 className="text-foreground mb-5 text-3xl font-semibold">{t('smartBlocking.keywordBlocking.title')}</h4>
            <div className="space-y-4">
              {keywordExamples.map((item, index) => (
                <div
                  key={item.keyword}
                  className="bg-background border-destructive/10 flex items-center gap-5 rounded-xl border-2 p-5"
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
                  <AlertTriangle className="text-destructive h-7 w-7 flex-shrink-0" />
                  <span className="text-foreground font-mono text-2xl">
                    {item.prefix}
                    <span className="text-destructive font-bold">{item.keyword}</span>
                    {item.suffix}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground mt-4 text-xl">{t('smartBlocking.keywordBlocking.description')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
