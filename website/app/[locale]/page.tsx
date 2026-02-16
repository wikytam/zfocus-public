'use client';

import { BentoGrid } from '@/components/bento-grid';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { IntroAnimation } from '@/components/intro-animation';
import { useState, useEffect } from 'react';

const INTRO_PLAYED_KEY = 'zfocus-intro-played';

export default function Home() {
  const [introAlreadyPlayed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(INTRO_PLAYED_KEY) === 'true';
  });
  const [showContent, setShowContent] = useState(introAlreadyPlayed);
  const [showIntro, setShowIntro] = useState(!introAlreadyPlayed);

  useEffect(() => {
    if (introAlreadyPlayed) {
      sessionStorage.setItem(INTRO_PLAYED_KEY, 'true');
    }
  }, [introAlreadyPlayed]);

  return (
    <>
      <Header />

      <main className="bg-background min-h-dvh">
        {showIntro && (
          <IntroAnimation
            onComplete={() => {
              setShowContent(true);
              sessionStorage.setItem(INTRO_PLAYED_KEY, 'true');
              setTimeout(() => {
                setShowIntro(false);
              }, 100);
            }}
          />
        )}

        <div className={`transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'} `}>
          <div className="pt-16">
            <BentoGrid />
            <Footer />
          </div>
        </div>
      </main>
    </>
  );
}
