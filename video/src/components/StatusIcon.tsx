import { Check, X, Minus } from 'lucide-react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

type FeatureStatus = 'yes' | 'no' | 'partial';

type StatusIconProps = {
  status: FeatureStatus;
  delay?: number;
  size?: number;
};

export const StatusIcon: React.FC<StatusIconProps> = ({ status, delay = 0, size = 40 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delayFrames = delay * fps;

  const scale = interpolate(frame, [delayFrames, delayFrames + 0.3 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const iconSize = size * 0.5;

  switch (status) {
    case 'yes':
      return (
        <div
          className="bg-accent/10 flex items-center justify-center rounded-full"
          style={{ width: size, height: size, transform: `scale(${scale})` }}>
          <Check className="text-accent" style={{ width: iconSize, height: iconSize }} strokeWidth={3} />
        </div>
      );
    case 'no':
      return (
        <div
          className="bg-destructive/10 flex items-center justify-center rounded-full"
          style={{ width: size, height: size, transform: `scale(${scale})` }}>
          <X className="text-destructive" style={{ width: iconSize, height: iconSize }} strokeWidth={3} />
        </div>
      );
    case 'partial':
      return (
        <div
          className="bg-chart-4/10 flex items-center justify-center rounded-full"
          style={{ width: size, height: size, transform: `scale(${scale})` }}>
          <Minus className="text-chart-4" style={{ width: iconSize, height: iconSize }} strokeWidth={3} />
        </div>
      );
  }
};
