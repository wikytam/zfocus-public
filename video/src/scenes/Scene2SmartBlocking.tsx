import { AbsoluteFill, Audio, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { SmartBlockingCard } from '../website-components/SmartBlockingCard';
import { Subtitle, buildSubtitleLines } from '../components/Subtitle';
import { SCENE_DURATION_FRAMES } from '../theme';
import { createTranslator } from '../i18n';
import type { Locale } from '../i18n';
import { voiceoverScripts } from '../voiceover';
import { getVoiceAudio } from '../audio/voiceAudio';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800'],
  subsets: ['latin', 'vietnamese'],
});

type Scene2Props = { locale: Locale };

export const Scene2SmartBlocking: React.FC<Scene2Props> = ({ locale }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = createTranslator(locale);
  const sub = voiceoverScripts[locale] ?? voiceoverScripts.en;

  const fadeIn = interpolate(frame, [0, 0.4 * fps], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [durationInFrames - 0.3 * fps, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
  });
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        backgroundColor: '#f8f8f6',
        opacity,
      }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #f8f8f6 0%, #f2f0ec 100%)',
        }}
      />
      <Audio src={getVoiceAudio(locale, 1)} />
      <div
        style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 48,
        }}>
        <SmartBlockingCard t={t} />
      </div>
      <Subtitle lines={buildSubtitleLines(sub[1], SCENE_DURATION_FRAMES)} />
    </AbsoluteFill>
  );
};
