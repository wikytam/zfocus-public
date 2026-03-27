import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

type AnimatedTextProps = {
  text: string;
  delay?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  maxWidth?: number;
  style?: React.CSSProperties;
};

type AnimatedLinesProps = {
  lines: string[];
  startDelay?: number;
  staggerDelay?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  gap?: number;
};

const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  delay = 0,
  fontSize = 40,
  fontWeight = 600,
  color = theme.colors.foreground,
  textAlign = 'center',
  lineHeight = 1.3,
  maxWidth,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delayFrames = delay * fps;

  const opacity = interpolate(frame, [delayFrames, delayFrames + 0.4 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(frame, [delayFrames, delayFrames + 0.4 * fps], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        fontSize,
        fontWeight,
        color,
        textAlign,
        lineHeight,
        maxWidth,
        ...style,
      }}>
      {text}
    </div>
  );
};

const AnimatedLines: React.FC<AnimatedLinesProps> = ({
  lines,
  startDelay = 0,
  staggerDelay = 0.3,
  fontSize = 36,
  fontWeight = 400,
  color = theme.colors.mutedForeground,
  textAlign = 'center',
  lineHeight = 1.5,
  gap = 16,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap,
      alignItems: textAlign === 'center' ? 'center' : 'flex-start',
    }}>
    {lines.map((line, i) => (
      <AnimatedText
        key={i}
        text={line}
        delay={startDelay + i * staggerDelay}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        textAlign={textAlign}
        lineHeight={lineHeight}
      />
    ))}
  </div>
);

export { AnimatedText, AnimatedLines };
