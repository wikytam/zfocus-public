'use client';

import { BentoGrid } from '@/components/bento-grid';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { IntroAnimation } from '@/components/intro-animation';
import { useState, useEffect, useCallback } from 'react';

const INTRO_PLAYED_KEY = 'zfocus-intro-played';
const INTRO_TTL_MS = 0 * 60 * 1000;

const isIntroStillValid = (): boolean => {
  const raw = sessionStorage.getItem(INTRO_PLAYED_KEY);
  if (!raw) return false;
  const timestamp = Number(raw);
  return Date.now() - timestamp < INTRO_TTL_MS;
};

const Home = () => {
  const [showContent, setShowContent] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (isIntroStillValid()) {
      setShowContent(true);
    } else {
      sessionStorage.removeItem(INTRO_PLAYED_KEY);
      setShowIntro(true);
    }
  }, []);

  const handleBeforeFade = useCallback(() => {
    setShowContent(true);
  }, []);

  const handleIntroComplete = useCallback(() => {
    sessionStorage.setItem(INTRO_PLAYED_KEY, String(Date.now()));
    setTimeout(() => {
      setShowIntro(false);
    }, 100);
  }, []);

  return (
    <>
      <Header />

      <main className="bg-background min-h-dvh">
        {showIntro && <IntroAnimation onBeforeFade={handleBeforeFade} onComplete={handleIntroComplete} />}

        {showContent && (
          <div className="pt-16">
            <BentoGrid />
            <Footer />
          </div>
        )}
      </main>
    </>
  );
};

export default Home;
