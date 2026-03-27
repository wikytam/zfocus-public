import { Img, staticFile, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { Lock, CheckCircle2 } from 'lucide-react';

type TranslatorFn = (key: string) => string;

type PrivacyCardProps = {
  t: TranslatorFn;
};

const browsers = [
  { src: 'icon/chrome-icon.svg', alt: 'Chrome' },
  { src: 'icon/edge-icon.svg', alt: 'Edge' },
  { src: 'icon/brave-icon.svg', alt: 'Brave' },
  { src: 'icon/opera-icon.svg', alt: 'Opera' },
  { src: 'icon/firefox-icon.svg', alt: 'Firefox' },
];

export const PrivacyCard: React.FC<PrivacyCardProps> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 0.4 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(frame, [0, 0.4 * fps], [20, 0], { extrapolateRight: 'clamp' });

  const lockOpacity = interpolate(frame, [0.3 * fps, 0.7 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const lockScale = interpolate(frame, [0.3 * fps, 0.7 * fps], [0.8, 1], { extrapolateRight: 'clamp' });
  const lockFloatSin = Math.sin((frame / fps) * 2) * 5;

  const featuresOpacity = interpolate(frame, [0.5 * fps, 0.9 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const featuresY = interpolate(frame, [0.5 * fps, 0.9 * fps], [15, 0], { extrapolateRight: 'clamp' });

  const quoteOpacity = interpolate(frame, [0.8 * fps, 1.2 * fps], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div className="bg-card border-border flex flex-col overflow-hidden rounded-3xl border-2 p-10 shadow-xl">
      <div
        className="mb-6 flex items-center gap-4"
        style={{
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
        }}>
        <div className="bg-foreground text-primary-foreground flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg">
          <Lock className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-foreground text-3xl font-bold">{t('privacy.title')}</h2>
          <p className="text-muted-foreground text-xl">{t('privacy.subtitle')}</p>
        </div>
      </div>

      <div
        className="my-6 flex flex-1 items-center justify-center"
        style={{
          opacity: lockOpacity,
          transform: `scale(${lockScale}) translateY(${lockFloatSin}px)`,
        }}>
        <div className="relative">
          <div className="bg-accent/10 absolute inset-0 rounded-full blur-3xl" aria-hidden="true" />
          <div className="from-accent/15 to-accent/5 border-accent/20 relative flex h-32 w-32 items-center justify-center rounded-full border-2 bg-gradient-to-br">
            <Lock className="text-accent h-16 w-16" />
          </div>
        </div>
      </div>

      <div
        className="space-y-4"
        style={{
          opacity: featuresOpacity,
          transform: `translateY(${featuresY}px)`,
        }}>
        <div className="flex items-center gap-4 text-xl">
          <CheckCircle2 className="text-accent h-7 w-7 flex-shrink-0" />
          <span className="text-foreground font-semibold">{t('privacy.localStorage')}</span>
        </div>
        <div className="flex items-center gap-4 text-xl">
          <CheckCircle2 className="text-accent h-7 w-7 flex-shrink-0" />
          <span className="text-foreground font-semibold">{t('privacy.zeroTracking')}</span>
        </div>
        <div className="flex items-center gap-4 text-xl">
          <CheckCircle2 className="text-accent h-7 w-7 flex-shrink-0" />
          <span className="text-foreground font-semibold">{t('privacy.optInErrorReporting')}</span>
        </div>
      </div>

      <div
        className="border-border mt-6 border-t pt-6"
        style={{
          opacity: quoteOpacity,
        }}>
        <p className="text-muted-foreground text-center text-xl italic leading-relaxed">
          {'"'}
          {t('privacy.quote')}
          {'"'}
        </p>
      </div>
    </div>
  );
};

export const BrowserSupportSection: React.FC<PrivacyCardProps> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sectionOpacity = interpolate(frame, [1 * fps, 1.4 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const sectionY = interpolate(frame, [1 * fps, 1.4 * fps], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <div
      className="bg-card border-border rounded-3xl border-2 p-8 shadow-xl"
      style={{
        opacity: sectionOpacity,
        transform: `translateY(${sectionY}px)`,
      }}>
      <div className="flex items-center justify-center gap-6">
        <span className="text-muted-foreground text-xl font-medium">{t('moreThings.browserSupport.title')}:</span>
        <div className="flex items-center gap-4">
          {browsers.map((browser, index) => (
            <div
              key={browser.alt}
              className="bg-secondary border-border flex h-14 w-14 items-center justify-center rounded-xl border"
              style={{
                opacity: interpolate(frame, [1.2 * fps + index * 4, 1.5 * fps + index * 4], [0, 1], {
                  extrapolateRight: 'clamp',
                }),
                transform: `scale(${interpolate(frame, [1.2 * fps + index * 4, 1.5 * fps + index * 4], [0.5, 1], {
                  extrapolateRight: 'clamp',
                })})`,
              }}>
              <Img src={staticFile(browser.src)} alt={browser.alt} style={{ width: 32, height: 32 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
