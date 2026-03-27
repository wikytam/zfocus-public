import { useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { Clock, Calendar, Target, CheckCircle2, XCircle, Pause } from 'lucide-react';

type TranslatorFn = (key: string) => string;

type TimeControlCardProps = {
  t: TranslatorFn;
};

export const TimeControlCard: React.FC<TimeControlCardProps> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(frame, [0, 0.4 * fps], [20, 0], { extrapolateRight: 'clamp' });

  const scheduleOpacity = interpolate(frame, [0.3 * fps, 0.7 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const scheduleY = interpolate(frame, [0.3 * fps, 0.7 * fps], [15, 0], { extrapolateRight: 'clamp' });

  const activeTabOpacity = interpolate(frame, [0.5 * fps, 0.9 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const activeTabY = interpolate(frame, [0.5 * fps, 0.9 * fps], [15, 0], { extrapolateRight: 'clamp' });

  const pauseOpacity = interpolate(frame, [0.7 * fps, 1.1 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const pauseY = interpolate(frame, [0.7 * fps, 1.1 * fps], [15, 0], { extrapolateRight: 'clamp' });

  const statsOpacity = interpolate(frame, [1 * fps, 1.4 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const statsScale = interpolate(frame, [1 * fps, 1.4 * fps], [0.9, 1], { extrapolateRight: 'clamp' });

  return (
    <div className="bg-card border-border flex flex-col overflow-hidden rounded-3xl border-2 p-12 shadow-xl">
      <div
        className="mb-10 flex items-center gap-5"
        style={{
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
        }}>
        <div className="bg-foreground text-primary-foreground flex h-24 w-24 items-center justify-center rounded-2xl shadow-lg">
          <Clock className="h-12 w-12" />
        </div>
        <div>
          <h2 className="text-foreground text-5xl font-bold">{t('timeControl.title')}</h2>
          <p className="text-muted-foreground text-3xl">{t('timeControl.subtitle')}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-8">
        <div
          style={{
            opacity: scheduleOpacity,
            transform: `translateY(${scheduleY}px)`,
          }}>
          <h3 className="text-foreground mb-5 flex items-center gap-4 text-3xl font-semibold">
            <Calendar className="text-muted-foreground h-9 w-9" />
            {t('timeControl.schedule.title')}
          </h3>
          <div className="bg-secondary/60 border-border space-y-5 rounded-2xl border-2 p-8 text-3xl">
            <div className="flex justify-between">
              <span className="text-foreground font-semibold">{t('timeControl.schedule.monFri')}</span>
              <span className="text-muted-foreground font-mono">9:00-17:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground font-semibold">{t('timeControl.schedule.satSun')}</span>
              <span className="text-muted-foreground font-mono">{t('timeControl.schedule.off')}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            opacity: activeTabOpacity,
            transform: `translateY(${activeTabY}px)`,
          }}>
          <h3 className="text-foreground mb-5 flex items-center gap-4 text-3xl font-semibold">
            <Target className="text-muted-foreground h-9 w-9" />
            {t('timeControl.activeTabOnly.title')}
          </h3>
          <div className="bg-secondary/60 border-border space-y-5 rounded-2xl border-2 p-8 text-3xl">
            <div className="flex items-center gap-5">
              <XCircle className="text-destructive h-9 w-9 flex-shrink-0" />
              <span className="text-foreground">{t('timeControl.activeTabOnly.blockActive')}</span>
            </div>
            <div className="flex items-center gap-5">
              <CheckCircle2 className="text-accent h-9 w-9 flex-shrink-0" />
              <span className="text-muted-foreground">{t('timeControl.activeTabOnly.allowBackground')}</span>
            </div>
          </div>
        </div>

        <div
          style={{
            opacity: pauseOpacity,
            transform: `translateY(${pauseY}px)`,
          }}>
          <h3 className="text-foreground mb-5 flex items-center gap-4 text-3xl font-semibold">
            <Pause className="text-muted-foreground h-9 w-9" />
            {t('timeControl.quickPause.title')}
          </h3>
          <p className="text-muted-foreground text-3xl leading-relaxed">{t('timeControl.quickPause.description')}</p>
        </div>

        <div
          className="border-border mt-auto border-t-2 pt-8"
          style={{
            opacity: statsOpacity,
            transform: `scale(${statsScale})`,
          }}>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-secondary/60 border-border rounded-2xl border-2 p-8 text-center">
              <div className="text-foreground text-6xl font-bold">12</div>
              <div className="text-muted-foreground text-2xl">{t('statistics.blocksToday')}</div>
            </div>
            <div className="bg-secondary/60 border-border rounded-2xl border-2 p-8 text-center">
              <div className="text-foreground text-6xl font-bold">2.5h</div>
              <div className="text-muted-foreground text-2xl">{t('statistics.timeSaved')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
