import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

type BadgeProps = {
  text: string;
  delay?: number;
  variant?: 'accent' | 'muted';
};

export const Badge: React.FC<BadgeProps> = ({ text, delay = 0, variant = 'accent' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delayFrames = delay * fps;

  const opacity = interpolate(frame, [delayFrames, delayFrames + 0.3 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scale = interpolate(frame, [delayFrames, delayFrames + 0.3 * fps], [0.8, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const isAccent = variant === 'accent';

  return (
    <div
      style={{
        opacity,
        transform: `scale(${scale})`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        backgroundColor: isAccent ? theme.colors.accent : theme.colors.muted,
        color: isAccent ? theme.colors.accentForeground : theme.colors.mutedForeground,
        padding: '8px 20px',
        borderRadius: 999,
        fontSize: 24,
        fontWeight: 600,
      }}>
      {text}
    </div>
  );
};
