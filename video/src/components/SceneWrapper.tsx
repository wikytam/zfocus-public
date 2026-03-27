import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';
import { theme } from '../theme';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700', '800'],
  subsets: ['latin', 'vietnamese'],
});

type SceneWrapperProps = {
  children: React.ReactNode;
  sceneIndex: number;
  totalScenes: number;
  gradient?: 'default' | 'accent' | 'dark';
};

export const SceneWrapper: React.FC<SceneWrapperProps> = ({
  children,
  sceneIndex,
  totalScenes,
  gradient = 'default',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 0.4 * fps], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const fadeOut = interpolate(frame, [durationInFrames - 0.3 * fps, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
  });

  const opacity = Math.min(fadeIn, fadeOut);

  const progressWidth = ((sceneIndex + 1) / totalScenes) * 100;
  const progressAnim = interpolate(frame, [0, 0.8 * fps], [0, progressWidth], {
    extrapolateRight: 'clamp',
  });

  const bgGradient =
    gradient === 'dark'
      ? `linear-gradient(180deg, ${theme.colors.foreground} 0%, #2a2a2a 100%)`
      : gradient === 'accent'
        ? `linear-gradient(180deg, ${theme.colors.background} 0%, #e8f5ef 50%, ${theme.colors.background} 100%)`
        : `linear-gradient(180deg, ${theme.colors.background} 0%, ${theme.colors.secondary} 100%)`;

  return (
    <AbsoluteFill
      style={{
        fontFamily,
        background: bgGradient,
        opacity,
      }}>
      {children}

      {/* Thanh tiến trình ở đáy */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          backgroundColor: theme.colors.border,
        }}>
        <div
          style={{
            height: '100%',
            width: `${progressAnim}%`,
            backgroundColor: theme.colors.accent,
            borderRadius: '0 3px 3px 0',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export { fontFamily };
