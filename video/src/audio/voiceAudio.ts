import type { Locale } from '../i18n';

import voiceEn1 from './en/voice_1.mp3';
import voiceEn2 from './en/voice_2.mp3';
import voiceEn3 from './en/voice_3.mp3';
import voiceEn4 from './en/voice_4.mp3';
import voiceEn5 from './en/voice_5.mp3';
import voiceEn6 from './en/voice_6.mp3';
import voiceEn7 from './en/voice_7.mp3';

import voiceVi1 from './vi/voice_1.mp3';
import voiceVi2 from './vi/voice_2.mp3';
import voiceVi3 from './vi/voice_3.mp3';
import voiceVi4 from './vi/voice_4.mp3';
import voiceVi5 from './vi/voice_5.mp3';
import voiceVi6 from './vi/voice_6.mp3';
import voiceVi7 from './vi/voice_7.mp3';

const voiceAudioMap: Record<'en' | 'vi', string[]> = {
  en: [voiceEn1, voiceEn2, voiceEn3, voiceEn4, voiceEn5, voiceEn6, voiceEn7],
  vi: [voiceVi1, voiceVi2, voiceVi3, voiceVi4, voiceVi5, voiceVi6, voiceVi7],
};

export const getVoiceAudio = (locale: Locale, sceneIndex: number): string => {
  const lang = locale === 'vi' ? 'vi' : 'en';
  return voiceAudioMap[lang][sceneIndex];
};
