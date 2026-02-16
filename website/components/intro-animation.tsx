'use client';

import { useEffect, useState, useRef } from 'react';

interface IntroAnimationProps {
  onComplete: () => void;
}

const Logo = ({ size = 'xl' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-32 h-32',
  };

  return (
    <div className={`${sizes[size]} flex items-center justify-center`}>
      <svg width="500" height="500" viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M250 460C170 420 80 340 80 180V100L250 40L420 100V180C420 340 330 420 250 460Z"
          fill="var(--card)"
          stroke="var(--accent)"
          strokeWidth="25"
          strokeLinejoin="round"
        />
        <path
          d="M200 200H300L200 300H300"
          stroke="var(--foreground)"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [phase, setPhase] = useState<'bounce' | 'moving' | 'fading'>('bounce');
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bounceTimer = setTimeout(() => {
      setPhase('moving');
    }, 900);

    const fadingTimer = setTimeout(() => {
      setPhase('fading');
    }, 1600);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2100);

    return () => {
      clearTimeout(bounceTimer);
      clearTimeout(fadingTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <>
      {/* Background overlay with smoother fade */}
      <div
        className={`bg-background pointer-events-none fixed inset-0 z-[100] transition-opacity duration-700 ease-out ${phase === 'fading' ? 'opacity-0' : 'opacity-100'} `}
        aria-hidden="true"
      />

      {/* Animated logo */}
      <div
        ref={logoRef}
        className={` ${
          phase === 'bounce'
            ? 'fixed left-1/2 top-1/2 z-[101] -translate-x-1/2 -translate-y-1/2'
            : 'fixed left-0 right-0 top-0 z-[101]'
        } pointer-events-none transition-all duration-500 ease-in-out ${phase === 'fading' ? 'opacity-0' : 'opacity-100'} `}
        aria-hidden="true">
        {phase === 'bounce' ? (
          <div className="animate-logo-bounce">
            <Logo size="xl" />
          </div>
        ) : (
          <div className="mx-auto max-w-6xl px-6 py-3">
            <div className="flex items-center gap-2.5">
              <Logo size="sm" />
            </div>
          </div>
        )}
      </div>
    </>
  );
};
