import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

type SubtitleLine = {
  text: string;
  startFrame: number;
  endFrame: number;
};

type SubtitleProps = {
  lines: SubtitleLine[];
};

const buildSubtitleLines = (texts: string[], sceneDurationFrames: number): SubtitleLine[] => {
  const totalDuration = sceneDurationFrames;
  const lineCount = texts.length;
  const durationPerLine = totalDuration / lineCount;

  return texts.map((text, index) => ({
    text,
    startFrame: Math.floor(index * durationPerLine),
    endFrame: Math.floor((index + 1) * durationPerLine),
  }));
};

const Subtitle: React.FC<SubtitleProps> = ({ lines }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentLine = lines.find(line => frame >= line.startFrame && frame < line.endFrame);

  if (!currentLine) return null;

  const relativeFrame = frame - currentLine.startFrame;
  const lineDuration = currentLine.endFrame - currentLine.startFrame;

  const fadeInDuration = 0.2 * fps;
  const fadeOutDuration = 0.2 * fps;
  const fadeOutStart = lineDuration - fadeOutDuration;

  const opacity = interpolate(relativeFrame, [0, fadeInDuration, fadeOutStart, lineDuration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(relativeFrame, [0, fadeInDuration], [10, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 120,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 40px',
      }}>
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          borderRadius: 16,
          padding: '16px 28px',
          maxWidth: 900,
        }}>
        <p
          style={{
            color: '#ffffff',
            fontSize: 32,
            fontWeight: 500,
            textAlign: 'center',
            lineHeight: 1.5,
            margin: 0,
          }}>
          {currentLine.text}
        </p>
      </div>
    </div>
  );
};

export { buildSubtitleLines, Subtitle };
export type { SubtitleLine };
