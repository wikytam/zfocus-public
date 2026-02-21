'use client';

import { Button } from '@/components/ui/button';
import { Chrome, Download } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const BrowserIcons = () => (
  <div className="flex items-center gap-2.5">
    {[
      { src: '/icon/chrome-icon.svg', alt: 'Chrome' },
      { src: '/icon/edge-icon.svg', alt: 'Edge' },
      { src: '/icon/brave-icon.svg', alt: 'Brave' },
      { src: '/icon/opera-icon.svg', alt: 'Opera' },
      { src: '/icon/firefox-icon.svg', alt: 'Firefox' },
    ].map(b => (
      <div key={b.alt} className="bg-card border-border/60 flex h-7 w-7 items-center justify-center rounded-md border">
        <Image src={b.src} alt={b.alt} width={16} height={16} />
      </div>
    ))}
  </div>
);

const CTAButtons = ({ t, center = true }: { t: (k: string) => string; center?: boolean }) => (
  <div className={`mt-8 flex flex-wrap items-center gap-3 sm:mt-10 ${center ? 'justify-center' : ''}`}>
    <Button
      size="lg"
      className="bg-accent text-accent-foreground hover:bg-accent/90 h-11 cursor-pointer gap-2 rounded-full px-6 text-sm font-semibold shadow-[0_2px_12px_rgba(22,130,93,0.2)] sm:h-12 sm:px-7 sm:text-base">
      <Chrome className="h-5 w-5" />
      {t('cta.installChrome')}
    </Button>
    <Button
      size="lg"
      variant="outline"
      className="border-border hover:bg-secondary h-11 cursor-pointer gap-2 rounded-full px-6 text-sm font-semibold sm:h-12 sm:px-7 sm:text-base">
      <Download className="h-4 w-4" />
      {t('cta.firefox')}
    </Button>
  </div>
);

const OverviewImage = ({ className = '' }: { className?: string }) => (
  <div className={`bg-card border-border/60 overflow-hidden rounded-xl border shadow-xl sm:rounded-2xl ${className}`}>
    <Image
      src="/overview-light.png"
      alt="ZFocus overview"
      width={800}
      height={500}
      className="block h-auto w-full dark:hidden"
    />
    <Image
      src="/overview-dark.png"
      alt="ZFocus overview"
      width={800}
      height={500}
      className="hidden h-auto w-full dark:block"
    />
  </div>
);

const PauseCard = ({ className = '' }: { className?: string }) => (
  <div className={`bg-card border-border/60 overflow-hidden rounded-lg border shadow-lg ${className}`}>
    <Image src="/pause.png" alt="ZFocus pause" width={400} height={300} className="h-auto w-full" />
  </div>
);

const StyleLabel = ({ n, name }: { n: number; name: string }) => (
  <div className="bg-accent text-accent-foreground mb-4 inline-block rounded-full px-4 py-1.5 text-sm font-bold">
    Style {n}: {name}
  </div>
);

// ──────────────────────────────────────────────────

const Style1 = ({ t }: { t: (k: string) => string }) => (
  <section className="py-16">
    <StyleLabel n={1} name="Text Left + Image Right (current)" />
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
      <div className="text-center lg:text-left">
        <h1 className="text-foreground mb-6 text-balance text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.5rem]">
          {t('hero.title')}
        </h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-pretty text-lg leading-relaxed lg:mx-0">
          {t('hero.subtitle')}
        </p>
        <CTAButtons t={t} />
        <div className="mt-8 flex items-center justify-center gap-2 lg:justify-start">
          <span className="text-muted-foreground mr-2 text-xs">{t('moreThings.browserSupport.title')}:</span>
          <BrowserIcons />
        </div>
      </div>
      <div className="relative mx-auto w-full max-w-xs pb-8 sm:max-w-sm md:max-w-md lg:mx-0 lg:max-w-none lg:pb-10">
        <OverviewImage />
        <PauseCard className="absolute -bottom-4 left-0 w-24 sm:-bottom-5 sm:w-32 md:w-36 lg:-bottom-6 lg:-left-4 lg:w-44" />
      </div>
    </div>
  </section>
);

const Style2 = ({ t }: { t: (k: string) => string }) => (
  <section className="py-16">
    <StyleLabel n={2} name="Center Text + Full-width Image Below" />
    <div className="text-center">
      <h1 className="text-foreground mb-6 text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
        {t('hero.title')}
      </h1>
      <p className="text-muted-foreground mx-auto max-w-2xl text-pretty text-lg leading-relaxed md:text-xl">
        {t('hero.subtitle')}
      </p>
      <CTAButtons t={t} />
      <div className="mt-8 flex items-center justify-center gap-2">
        <span className="text-muted-foreground mr-2 text-xs">{t('moreThings.browserSupport.title')}:</span>
        <BrowserIcons />
      </div>
    </div>
    <div className="relative mx-auto mt-16 max-w-4xl pb-10">
      <OverviewImage className="shadow-2xl" />
      <PauseCard className="absolute -bottom-6 left-8 w-36 sm:w-44 md:w-52" />
    </div>
  </section>
);

const Style3 = ({ t }: { t: (k: string) => string }) => (
  <section className="py-16">
    <StyleLabel n={3} name="Image Left + Text Right (reversed)" />
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
      <div className="relative order-2 mx-auto w-full max-w-xs pb-8 sm:max-w-sm md:max-w-md lg:order-1 lg:mx-0 lg:max-w-none lg:pb-10">
        <OverviewImage />
        <PauseCard className="absolute -bottom-4 right-0 w-24 sm:-bottom-5 sm:w-32 md:w-36 lg:-bottom-6 lg:-right-4 lg:w-44" />
      </div>
      <div className="order-1 text-center lg:order-2 lg:text-left">
        <h1 className="text-foreground mb-6 text-balance text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.5rem]">
          {t('hero.title')}
        </h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-pretty text-lg leading-relaxed lg:mx-0">
          {t('hero.subtitle')}
        </p>
        <CTAButtons t={t} />
        <div className="mt-8 flex items-center justify-center gap-2 lg:justify-start">
          <span className="text-muted-foreground mr-2 text-xs">{t('moreThings.browserSupport.title')}:</span>
          <BrowserIcons />
        </div>
      </div>
    </div>
  </section>
);

const Style4 = ({ t }: { t: (k: string) => string }) => (
  <section className="py-16">
    <StyleLabel n={4} name="Overlapping - Image as Background" />
    <div className="relative overflow-hidden rounded-3xl">
      <div className="relative mx-auto max-w-4xl">
        <OverviewImage className="opacity-20 dark:opacity-15" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-foreground mb-6 text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
          {t('hero.title')}
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-pretty text-lg leading-relaxed md:text-xl">
          {t('hero.subtitle')}
        </p>
        <CTAButtons t={t} />
        <div className="mt-8 flex items-center justify-center gap-2">
          <span className="text-muted-foreground mr-2 text-xs">{t('moreThings.browserSupport.title')}:</span>
          <BrowserIcons />
        </div>
      </div>
    </div>
  </section>
);

const Style5 = ({ t }: { t: (k: string) => string }) => (
  <section className="py-16">
    <StyleLabel n={5} name="Stacked Cards - 3 Images Side by Side" />
    <div className="text-center">
      <h1 className="text-foreground mb-6 text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
        {t('hero.title')}
      </h1>
      <p className="text-muted-foreground mx-auto max-w-2xl text-pretty text-lg leading-relaxed md:text-xl">
        {t('hero.subtitle')}
      </p>
      <CTAButtons t={t} />
      <div className="mt-8 flex items-center justify-center gap-2">
        <span className="text-muted-foreground mr-2 text-xs">{t('moreThings.browserSupport.title')}:</span>
        <BrowserIcons />
      </div>
    </div>
    <div className="mt-16 grid gap-4 sm:grid-cols-3">
      <div className="bg-card border-border/60 overflow-hidden rounded-2xl border shadow-xl">
        <Image
          src="/overview-light.png"
          alt="Overview light"
          width={800}
          height={500}
          className="block h-auto w-full dark:hidden"
        />
        <Image
          src="/overview-dark.png"
          alt="Overview dark"
          width={800}
          height={500}
          className="hidden h-auto w-full dark:block"
        />
      </div>
      <div className="bg-card border-border/60 overflow-hidden rounded-2xl border shadow-xl">
        <Image src="/pause.png" alt="Pause" width={400} height={300} className="h-auto w-full" />
      </div>
      <div className="bg-card border-border/60 overflow-hidden rounded-2xl border shadow-xl">
        <Image
          src="/overview-dark.png"
          alt="Overview dark"
          width={800}
          height={500}
          className="block h-auto w-full dark:hidden"
        />
        <Image
          src="/overview-light.png"
          alt="Overview light"
          width={800}
          height={500}
          className="hidden h-auto w-full dark:block"
        />
      </div>
    </div>
  </section>
);

const Style6 = ({ t }: { t: (k: string) => string }) => (
  <section className="py-16">
    <StyleLabel n={6} name="Asymmetric Grid - Large + Small" />
    <div className="grid items-center gap-10 lg:grid-cols-5 lg:gap-8">
      <div className="text-center lg:col-span-2 lg:text-left">
        <h1 className="text-foreground mb-6 text-balance text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">
          {t('hero.title')}
        </h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-pretty text-lg leading-relaxed lg:mx-0">
          {t('hero.subtitle')}
        </p>
        <CTAButtons t={t} />
        <div className="mt-8 flex items-center justify-center gap-2 lg:justify-start">
          <span className="text-muted-foreground mr-2 text-xs">{t('moreThings.browserSupport.title')}:</span>
          <BrowserIcons />
        </div>
      </div>
      <div className="relative lg:col-span-3">
        <div className="grid gap-4 sm:grid-cols-5">
          <div className="sm:col-span-3">
            <OverviewImage />
          </div>
          <div className="sm:col-span-2">
            <PauseCard className="h-full [&>img]:h-full [&>img]:object-cover" />
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Style7 = ({ t }: { t: (k: string) => string }) => (
  <section className="py-16">
    <StyleLabel n={7} name="Floating Window - Tilted Perspective" />
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
      <div className="text-center lg:text-left">
        <h1 className="text-foreground mb-6 text-balance text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl md:text-5xl lg:text-[3.5rem]">
          {t('hero.title')}
        </h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-pretty text-lg leading-relaxed lg:mx-0">
          {t('hero.subtitle')}
        </p>
        <CTAButtons t={t} />
        <div className="mt-8 flex items-center justify-center gap-2 lg:justify-start">
          <span className="text-muted-foreground mr-2 text-xs">{t('moreThings.browserSupport.title')}:</span>
          <BrowserIcons />
        </div>
      </div>
      <div
        className="relative mx-auto w-full max-w-xs pb-12 sm:max-w-sm md:max-w-md lg:mx-0 lg:max-w-none"
        style={{ perspective: '1200px' }}>
        <div
          style={{ transform: 'rotateY(-8deg) rotateX(4deg)' }}
          className="transition-transform duration-500 hover:!rotate-0">
          <OverviewImage className="shadow-2xl" />
        </div>
        <PauseCard className="absolute -bottom-4 -left-2 w-28 rotate-3 shadow-2xl sm:w-36 md:w-40 lg:w-44" />
      </div>
    </div>
  </section>
);

const Style8 = ({ t }: { t: (k: string) => string }) => (
  <section className="py-16">
    <StyleLabel n={8} name="Split Screen - Text Over Gradient" />
    <div className="grid items-stretch lg:grid-cols-2">
      <div className="bg-accent/5 flex flex-col justify-center rounded-t-3xl p-8 sm:p-12 lg:rounded-l-3xl lg:rounded-tr-none lg:p-16">
        <h1 className="text-foreground mb-6 text-balance text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl md:text-5xl">
          {t('hero.title')}
        </h1>
        <p className="text-muted-foreground max-w-lg text-pretty text-lg leading-relaxed">{t('hero.subtitle')}</p>
        <CTAButtons t={t} center={false} />
        <div className="mt-8 flex items-center gap-2">
          <span className="text-muted-foreground mr-2 text-xs">{t('moreThings.browserSupport.title')}:</span>
          <BrowserIcons />
        </div>
      </div>
      <div className="bg-card relative flex items-center justify-center overflow-hidden rounded-b-3xl p-8 sm:p-12 lg:rounded-r-3xl lg:rounded-bl-none lg:p-16">
        <div className="relative w-full">
          <OverviewImage />
          <PauseCard className="absolute -bottom-4 -left-4 w-32 sm:w-40" />
        </div>
      </div>
    </div>
  </section>
);

const Style9 = ({ t }: { t: (k: string) => string }) => (
  <section className="py-16">
    <StyleLabel n={9} name="Hero with Browser Mockup Frame" />
    <div className="text-center">
      <h1 className="text-foreground mb-6 text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
        {t('hero.title')}
      </h1>
      <p className="text-muted-foreground mx-auto max-w-2xl text-pretty text-lg leading-relaxed md:text-xl">
        {t('hero.subtitle')}
      </p>
      <CTAButtons t={t} />
      <div className="mt-8 flex items-center justify-center gap-2">
        <span className="text-muted-foreground mr-2 text-xs">{t('moreThings.browserSupport.title')}:</span>
        <BrowserIcons />
      </div>
    </div>
    <div className="relative mx-auto mt-16 max-w-4xl pb-10">
      <div className="bg-card border-border/60 overflow-hidden rounded-2xl border shadow-2xl">
        <div className="border-border/40 flex items-center gap-2 border-b px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <div className="bg-secondary mx-auto flex-1 rounded-md px-4 py-1 text-center text-xs text-gray-500">
            chrome-extension://zfocus
          </div>
        </div>
        <Image
          src="/overview-light.png"
          alt="ZFocus"
          width={800}
          height={500}
          className="block h-auto w-full dark:hidden"
        />
        <Image
          src="/overview-dark.png"
          alt="ZFocus"
          width={800}
          height={500}
          className="hidden h-auto w-full dark:block"
        />
      </div>
      <PauseCard className="absolute -bottom-6 right-8 w-36 sm:w-44 md:w-52" />
    </div>
  </section>
);

const Style10 = ({ t }: { t: (k: string) => string }) => (
  <section className="py-16">
    <StyleLabel n={10} name="Diagonal Split - Angled Separator" />
    <div className="relative overflow-hidden rounded-3xl">
      <div className="grid lg:grid-cols-2">
        <div className="relative z-10 flex flex-col justify-center p-8 sm:p-12 lg:p-16">
          <h1 className="text-foreground mb-6 text-balance text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl md:text-5xl">
            {t('hero.title')}
          </h1>
          <p className="text-muted-foreground max-w-lg text-pretty text-lg leading-relaxed">{t('hero.subtitle')}</p>
          <CTAButtons t={t} center={false} />
          <div className="mt-8 flex items-center gap-2">
            <span className="text-muted-foreground mr-2 text-xs">{t('moreThings.browserSupport.title')}:</span>
            <BrowserIcons />
          </div>
        </div>
        <div className="bg-accent/5 relative flex items-center justify-center p-8 sm:p-12 lg:p-16">
          <div className="pointer-events-none absolute -left-20 bottom-0 top-0 hidden w-40 skew-x-[-6deg] bg-[var(--background)] lg:block" />
          <div className="relative w-full">
            <OverviewImage className="shadow-2xl" />
            <PauseCard className="absolute -bottom-4 left-4 w-28 sm:w-36 lg:w-40" />
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ──────────────────────────────────────────────────

const HeroPreview = () => {
  const t = useTranslations();
  const [selectedStyle, setSelectedStyle] = useState<number | null>(null);

  const styles = [
    { n: 1, name: 'Text Left + Image Right' },
    { n: 2, name: 'Center + Full Image Below' },
    { n: 3, name: 'Image Left + Text Right' },
    { n: 4, name: 'Overlapping Background' },
    { n: 5, name: '3 Images Side by Side' },
    { n: 6, name: 'Asymmetric Grid' },
    { n: 7, name: 'Tilted Perspective' },
    { n: 8, name: 'Split Screen' },
    { n: 9, name: 'Browser Mockup' },
    { n: 10, name: 'Diagonal Split' },
  ];

  const Components = [Style1, Style2, Style3, Style4, Style5, Style6, Style7, Style8, Style9, Style10];

  return (
    <div className="bg-background min-h-dvh">
      <div className="border-border/60 bg-card/80 sticky top-0 z-50 border-b px-6 py-4 backdrop-blur-md">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-foreground mb-3 text-lg font-bold">Hero Style Preview - Click to jump</h2>
          <div className="flex flex-wrap gap-2">
            {styles.map(s => (
              <button
                key={s.n}
                onClick={() => {
                  setSelectedStyle(s.n);
                  document.getElementById(`style-${s.n}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  selectedStyle === s.n
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'border-border hover:bg-secondary cursor-pointer'
                }`}>
                {s.n}. {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6">
        {Components.map((Comp, i) => (
          <div key={i} id={`style-${i + 1}`} className="border-border/30 scroll-mt-28 border-b last:border-b-0">
            <Comp t={t} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroPreview;
