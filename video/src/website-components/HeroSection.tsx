import { Img, staticFile, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';
import { Timer, Target, ShieldBan, Lock } from 'lucide-react';

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

const taglineKeys = [
  { key: 'hero.tagline1', highlight: true, Icon: Timer },
  { key: 'hero.tagline2', highlight: true, Icon: Target },
  { key: 'hero.tagline3', highlight: false, Icon: ShieldBan },
  { key: 'hero.tagline4', highlight: true, Icon: Lock },
];

export const HeroSection: React.FC<HeroSectionProps> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 0.5 * fps], [30, 0], { extrapolateRight: 'clamp' });

  const browserOpacity = interpolate(frame, [0.6 * fps, 1 * fps], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8">
      <div
        className="mb-6 flex items-center gap-6"
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}>
        <Img src={staticFile('icon/logo.svg')} alt="ZFocus" style={{ width: 100, height: 100 }} />
        <h1 className="text-foreground text-center text-7xl font-bold tracking-tight">ZFocus</h1>
      </div>

      <div className="mb-10 mt-24 grid grid-cols-2 gap-10">
        {taglineKeys.map((tag, index) => {
          const delay = 0.3 * fps + index * 8;
          const tagOpacity = interpolate(frame, [delay, delay + 0.4 * fps], [0, 1], { extrapolateRight: 'clamp' });
          const tagScale = interpolate(frame, [delay, delay + 0.4 * fps], [0.6, 1], { extrapolateRight: 'clamp' });
          const tagX = interpolate(frame, [delay, delay + 0.4 * fps], [-30, 0], { extrapolateRight: 'clamp' });
          const iconRotate = interpolate(frame, [delay, delay + 0.5 * fps], [-20, 0], { extrapolateRight: 'clamp' });

          return (
            <div
              key={tag.key}
              className={`flex items-center gap-3 rounded-2xl px-6 py-6 text-2xl font-semibold shadow-lg ${
                tag.highlight ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground border-border border'
              }`}
              style={{
                opacity: tagOpacity,
                transform: `scale(${tagScale}) translateX(${tagX}px)`,
              }}>
              <tag.Icon
                className="h-7 w-7"
                style={{
                  transform: `rotate(${iconRotate}deg)`,
                }}
              />
              {t(tag.key)}
            </div>
          );
        })}
      </div>

      <div
        className="mb-10 mt-8 flex items-center gap-4"
        style={{
          opacity: browserOpacity,
        }}>
        <span className="text-muted-foreground text-2xl">{t('moreThings.browserSupport.title')}:</span>
        <div className="flex items-center gap-4">
          {browsers.map((browser, index) => (
            <div
              key={browser.alt}
              className="bg-card border-border flex h-16 w-16 items-center justify-center rounded-xl border shadow-sm"
              style={{
                opacity: interpolate(frame, [0.8 * fps + index * 3, 1 * fps + index * 3], [0, 1], {
                  extrapolateRight: 'clamp',
                }),
                transform: `scale(${interpolate(frame, [0.8 * fps + index * 3, 1 * fps + index * 3], [0.5, 1], {
                  extrapolateRight: 'clamp',
                })})`,
              }}>
              <Img src={staticFile(browser.src)} alt={browser.alt} style={{ width: 36, height: 36 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
