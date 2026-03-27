import { Audio } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { Scene1Hero } from './scenes/Scene1Hero';
import bgMusic from './audio/bg-music.mp3';
import { Scene2SmartBlocking } from './scenes/Scene2SmartBlocking';
import { Scene3TimeControl } from './scenes/Scene3TimeControl';
import { Scene4AdvancedActions } from './scenes/Scene4AdvancedActions';
import { Scene5Privacy } from './scenes/Scene5Privacy';
import { Scene6Comparison } from './scenes/Scene6Comparison';
import { Scene7Pricing } from './scenes/Scene7Pricing';
import { SCENE_DURATION_FRAMES, TRANSITION_DURATION_FRAMES } from './theme';
import type { Locale } from './i18n';

export type ZFocusAdProps = {
  locale: Locale;
};

export const ZFocusAd: React.FC<ZFocusAdProps> = ({ locale }) => {
  const td = TRANSITION_DURATION_FRAMES;

  return (
    <>
      <Audio src={bgMusic} volume={0.25} loop />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION_FRAMES}>
          <Scene1Hero locale={locale} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: td })} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION_FRAMES}>
          <Scene2SmartBlocking locale={locale} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-left' })}
          timing={linearTiming({ durationInFrames: td })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION_FRAMES}>
          <Scene3TimeControl locale={locale} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: td })} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION_FRAMES}>
          <Scene4AdvancedActions locale={locale} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-right' })}
          timing={linearTiming({ durationInFrames: td })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION_FRAMES}>
          <Scene5Privacy locale={locale} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: td })} />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION_FRAMES}>
          <Scene6Comparison locale={locale} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-bottom' })}
          timing={linearTiming({ durationInFrames: td })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE_DURATION_FRAMES}>
          <Scene7Pricing locale={locale} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
