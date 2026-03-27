import './index.css';
import { Composition, Folder } from 'remotion';
import { ZFocusAd } from './Composition';
import {
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
  VIDEO_FPS,
  SCENE_DURATION_FRAMES,
  TRANSITION_DURATION_FRAMES,
  TOTAL_SCENES,
} from './theme';

const TOTAL_DURATION = TOTAL_SCENES * SCENE_DURATION_FRAMES - (TOTAL_SCENES - 1) * TRANSITION_DURATION_FRAMES;

const locales = ['vi', 'en', 'ko', 'ja', 'zh'] as const;

export const RemotionRoot: React.FC = () => (
  <Folder name="ZFocus-Ad">
    {locales.map(locale => (
      <Composition
        key={locale}
        id={`ZFocusAd-${locale}`}
        component={ZFocusAd}
        durationInFrames={TOTAL_DURATION}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{ locale }}
      />
    ))}
  </Folder>
);
