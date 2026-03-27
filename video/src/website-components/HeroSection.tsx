import { Img, staticFile, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';

type TranslatorFn = (key: string) => string;

type HeroSectionProps = {
  t: TranslatorFn;
};

const browsers = [
  { src: 'icon/chrome-icon.svg', alt: 'Chrome' },
  { src: 'icon/edge-icon.svg', alt: 'Edge' },
  { src: 'icon/brave-icon.svg', alt: 'Brave' },
  { src: 'icon/opera-icon.svg', alt: 'Opera' },
  { src: 'icon/firefox-icon.svg', alt: 'Firefox' },
];

export const HeroSection: React.FC<HeroSectionProps> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 0.5 * fps], [30, 0], { extrapolateRight: 'clamp' });

  const subtitleOpacity = interpolate(frame, [0.3 * fps, 0.8 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const subtitleY = interpolate(frame, [0.3 * fps, 0.8 * fps], [20, 0], { extrapolateRight: 'clamp' });

  const browserOpacity = interpolate(frame, [0.6 * fps, 1 * fps], [0, 1], { extrapolateRight: 'clamp' });

  const screenshotOpacity = interpolate(frame, [0.8 * fps, 1.3 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const screenshotY = interpolate(frame, [0.8 * fps, 1.3 * fps], [40, 0], { extrapolateRight: 'clamp' });
  const screenshotRotateY = interpolate(frame, [0.8 * fps, 1.8 * fps], [-12, -8], { extrapolateRight: 'clamp' });
  const screenshotRotateX = interpolate(frame, [0.8 * fps, 1.8 * fps], [8, 4], { extrapolateRight: 'clamp' });

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8">
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}>
        <h1 className="text-foreground mb-8 text-center text-5xl font-bold leading-tight tracking-tight">
          {t('hero.title')}
        </h1>
      </div>

      <div
        style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
        }}>
        <p className="text-muted-foreground mx-auto mb-10 max-w-2xl text-center text-2xl leading-relaxed">
          {t('hero.subtitle')}
        </p>
      </div>

      <div
        className="mb-10 flex items-center gap-3"
        style={{
          opacity: browserOpacity,
        }}>
        <span className="text-muted-foreground text-lg">{t('moreThings.browserSupport.title')}:</span>
        <div className="flex items-center gap-3">
          {browsers.map((browser, index) => (
            <div
              key={browser.alt}
              className="bg-card border-border flex h-12 w-12 items-center justify-center rounded-xl border shadow-sm"
              style={{
                opacity: interpolate(frame, [0.8 * fps + index * 3, 1 * fps + index * 3], [0, 1], {
                  extrapolateRight: 'clamp',
                }),
                transform: `scale(${interpolate(frame, [0.8 * fps + index * 3, 1 * fps + index * 3], [0.5, 1], {
                  extrapolateRight: 'clamp',
                })})`,
              }}>
              <Img src={staticFile(browser.src)} alt={browser.alt} style={{ width: 28, height: 28 }} />
            </div>
          ))}
        </div>
      </div>

      <div
        className="relative w-full max-w-xl"
        style={{
          opacity: screenshotOpacity,
          transform: `translateY(${screenshotY}px)`,
          perspective: 1200,
        }}>
        <div
          style={{
            transform: `rotateY(${screenshotRotateY}deg) rotateX(${screenshotRotateX}deg)`,
          }}>
          <div className="bg-card border-border overflow-hidden rounded-2xl border-2 shadow-2xl">
            <Img
              src={staticFile('screenshots/overview-light.png')}
              alt="ZFocus overview"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
        </div>

        <div
          className="bg-card border-border absolute -bottom-6 -left-4 w-40 overflow-hidden rounded-xl border-2 shadow-xl"
          style={{
            transform: `rotate(3deg)`,
            opacity: interpolate(frame, [1.5 * fps, 1.9 * fps], [0, 1], { extrapolateRight: 'clamp' }),
          }}>
          <Img src={staticFile('screenshots/pause.png')} alt="ZFocus pause" style={{ width: '100%', height: 'auto' }} />
        </div>
      </div>
    </div>
  );
};
