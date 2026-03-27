import { Img, staticFile, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { Zap, Star, XCircle, ArrowRight, Plus, Clock } from 'lucide-react';

type TranslatorFn = (key: string) => string;

type AdvancedActionsCardProps = {
  t: TranslatorFn;
};

export const AdvancedActionsCard: React.FC<AdvancedActionsCardProps> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(frame, [0, 0.4 * fps], [20, 0], { extrapolateRight: 'clamp' });

  const closeTabOpacity = interpolate(frame, [0.3 * fps, 0.7 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const closeTabY = interpolate(frame, [0.3 * fps, 0.7 * fps], [15, 0], { extrapolateRight: 'clamp' });

  const redirectOpacity = interpolate(frame, [0.5 * fps, 0.9 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const redirectX = interpolate(frame, [0.5 * fps, 0.9 * fps], [-20, 0], { extrapolateRight: 'clamp' });

  const timeLimitOpacity = interpolate(frame, [0.7 * fps, 1.1 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const timeLimitX = interpolate(frame, [0.7 * fps, 1.1 * fps], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <div className="bg-card border-border flex flex-col overflow-hidden rounded-3xl border-2 p-10 shadow-xl">
      <div
        className="mb-8 flex items-center gap-4"
        style={{
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
        }}>
        <div className="from-accent/20 to-accent/10 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br">
          <Zap className="text-accent h-10 w-10" />
        </div>
        <div>
          <h2 className="text-foreground text-4xl font-bold">{t('advancedActions.title')}</h2>
          <p className="text-muted-foreground text-2xl">{t('advancedActions.subtitle')}</p>
        </div>
      </div>

      <div
        className="mb-8"
        style={{
          opacity: closeTabOpacity,
          transform: `translateY(${closeTabY}px)`,
        }}>
        <div className="mb-4 flex items-center gap-3">
          <span className="bg-accent text-accent-foreground inline-flex items-center gap-2 rounded-full px-5 py-2 text-xl font-semibold">
            <Star className="h-5 w-5" />
            {t('advancedActions.closeTab.badge')}
          </span>
          <h3 className="text-foreground text-2xl font-semibold">{t('advancedActions.closeTab.title')}</h3>
        </div>
        <p className="text-muted-foreground mb-4 text-2xl">{t('advancedActions.closeTab.description')}</p>
        <div className="bg-secondary/60 border-border flex items-center justify-center rounded-2xl border p-6">
          <div className="flex items-center gap-4 text-2xl">
            <span className="text-foreground font-semibold">{t('advancedActions.closeTab.demo')}</span>
            <XCircle className="text-destructive h-8 w-8" />
            <span className="text-muted-foreground">{t('advancedActions.closeTab.or')}</span>
          </div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-6">
        <div
          style={{
            opacity: redirectOpacity,
            transform: `translateX(${redirectX}px)`,
          }}>
          <h3 className="text-foreground mb-4 text-2xl font-semibold">{t('advancedActions.redirectLink.title')}</h3>
          <p className="text-muted-foreground mb-4 text-xl">{t('advancedActions.redirectLink.description')}</p>
          <div className="bg-secondary/60 border-border space-y-4 rounded-2xl border p-6 font-mono text-xl">
            <div className="flex items-center justify-center gap-4">
              <Img src={staticFile('icon/facebook.svg')} alt="Facebook" style={{ width: 28, height: 28 }} />
              <span className="text-foreground line-through opacity-50">facebook.com</span>
              <ArrowRight className="text-muted-foreground h-6 w-6" />
              <Img src={staticFile('icon/notion.svg')} alt="Notion" style={{ width: 28, height: 28 }} />
              <span className="text-accent font-bold">notion.so</span>
            </div>
            <div className="flex items-center justify-center gap-4">
              <Img src={staticFile('icon/instagram.svg')} alt="Instagram" style={{ width: 28, height: 28 }} />
              <span className="text-foreground line-through opacity-50">instagram.com</span>
              <ArrowRight className="text-muted-foreground h-6 w-6" />
              <Img src={staticFile('icon/mail.svg')} alt="Gmail" style={{ width: 28, height: 28 }} />
              <span className="text-accent font-bold">gmail.com</span>
            </div>
            <span className="text-muted-foreground flex items-center justify-center gap-2 text-xl">
              {t('advancedActions.redirectLink.more')}
              <Plus className="h-6 w-6" />
            </span>
          </div>
        </div>

        <div
          style={{
            opacity: timeLimitOpacity,
            transform: `translateX(${timeLimitX}px)`,
          }}>
          <h3 className="text-foreground mb-4 text-2xl font-semibold">{t('advancedActions.timeBasedBlock.title')}</h3>
          <p className="text-muted-foreground mb-4 text-xl">{t('advancedActions.timeBasedBlock.description')}</p>
          <div className="bg-secondary/60 border-border space-y-4 rounded-2xl border p-6 text-2xl">
            <div className="flex items-center gap-4">
              <Clock className="text-accent h-7 w-7 flex-shrink-0" />
              <span className="text-foreground">{t('advancedActions.timeBasedBlock.option1')}</span>
            </div>
            <div className="flex items-center gap-4">
              <Clock className="text-accent h-7 w-7 flex-shrink-0" />
              <span className="text-foreground">{t('advancedActions.timeBasedBlock.option2')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
