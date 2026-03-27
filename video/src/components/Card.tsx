import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

type CardProps = {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
};

export const Card: React.FC<CardProps> = ({ children, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delayFrames = delay * fps;

  const opacity = interpolate(frame, [delayFrames, delayFrames + 0.5 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(frame, [delayFrames, delayFrames + 0.5 * fps], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scale = interpolate(frame, [delayFrames, delayFrames + 0.5 * fps], [0.95, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        backgroundColor: theme.colors.card,
        border: `2px solid ${theme.colors.border}`,
        borderRadius: 24,
        padding: 32,
        ...style,
      }}>
      {children}
    </div>
  );
};
