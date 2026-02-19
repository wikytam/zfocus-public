'use client';

import { useRef, useEffect, useCallback } from 'react';

interface IntroAnimationProps {
  onComplete: () => void;
  onBeforeFade?: () => void;
}

const LOGO_SIZE_START = 128;
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

const LogoSvg = () => (
  <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
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
);

const getHeaderLogoRect = (): DOMRect | null => {
  const headerLogo = document.querySelector('header svg[viewBox="0 0 500 500"]');
  return headerLogo?.getBoundingClientRect() ?? null;
};

export const IntroAnimation = ({ onComplete, onBeforeFade }: IntroAnimationProps) => {
  const logoRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const completeCalled = useRef(false);
  const beforeFadeCalled = useRef(false);

  const fireBeforeFade = useCallback(() => {
    if (beforeFadeCalled.current) return;
    beforeFadeCalled.current = true;
    onBeforeFade?.();
  }, [onBeforeFade]);

  const fireComplete = useCallback(() => {
    if (completeCalled.current) return;
    completeCalled.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const logoEl = logoRef.current;
    const overlayEl = overlayRef.current;
    if (!logoEl || !overlayEl) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const startX = (vw - LOGO_SIZE_START) / 2;
    const startY = (vh - LOGO_SIZE_START) / 2;

    const targetRect = getHeaderLogoRect();
    const endX = targetRect ? targetRect.left : 16;
    const endY = targetRect ? targetRect.top : 8;
    const endSize = targetRect ? targetRect.width : 32;

    const logoAnim = logoEl.animate(
      [
        {
          left: `${startX}px`,
          top: `${-LOGO_SIZE_START}px`,
          width: `${LOGO_SIZE_START}px`,
          height: `${LOGO_SIZE_START}px`,
          opacity: 0,
          offset: 0,
        },
        {
          left: `${startX}px`,
          top: `${startY + 20}px`,
          width: `${LOGO_SIZE_START}px`,
          height: `${LOGO_SIZE_START}px`,
          opacity: 1,
          offset: 0.26,
        },
        {
          left: `${startX}px`,
          top: `${startY - 8}px`,
          width: `${LOGO_SIZE_START}px`,
          height: `${LOGO_SIZE_START}px`,
          opacity: 1,
          offset: 0.34,
        },
        {
          left: `${startX}px`,
          top: `${startY}px`,
          width: `${LOGO_SIZE_START}px`,
          height: `${LOGO_SIZE_START}px`,
          opacity: 1,
          offset: 0.43,
        },
        {
          left: `${endX}px`,
          top: `${endY}px`,
          width: `${endSize}px`,
          height: `${endSize}px`,
          opacity: 1,
          offset: 0.76,
        },
        {
          left: `${endX}px`,
          top: `${endY}px`,
          width: `${endSize}px`,
          height: `${endSize}px`,
          opacity: 0,
          offset: 1,
        },
      ],
      {
        duration: 2100,
        easing: EASING,
        fill: 'forwards',
      },
    );

    const overlayAnim = overlayEl.animate(
      [
        { opacity: 1, offset: 0 },
        { opacity: 1, offset: 0.76 },
        { opacity: 0, offset: 1 },
      ],
      {
        duration: 2100,
        easing: EASING,
        fill: 'forwards',
      },
    );

    const logoSettleMs = 2100 * 0.43;
    const mountTimer = setTimeout(fireBeforeFade, logoSettleMs);

    overlayAnim.onfinish = fireComplete;

    return () => {
      clearTimeout(mountTimer);
      logoAnim.cancel();
      overlayAnim.cancel();
    };
  }, [fireBeforeFade, fireComplete]);

  return (
    <>
      <div ref={overlayRef} className="bg-background pointer-events-none fixed inset-0 z-[100]" aria-hidden="true" />
      <div
        ref={logoRef}
        className="pointer-events-none fixed z-[101]"
        style={{ width: LOGO_SIZE_START, height: LOGO_SIZE_START }}
        aria-hidden="true">
        <LogoSvg />
      </div>
    </>
  );
};
