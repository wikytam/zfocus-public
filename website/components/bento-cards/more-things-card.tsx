'use client';

import { Sparkles, Sun, Moon, MonitorSmartphone } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export const MoreThingsCard = () => {
  const t = useTranslations();

  return (
    <div
      className="border-border bg-card card-hover-lift hover:border-accent/30 animate-bento-card-reveal group relative overflow-hidden rounded-2xl border p-6 opacity-0 md:col-span-12 md:p-8 lg:col-span-7"
      style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
      {/* Subtle gradient overlay */}
      <div
        className="from-accent/[0.02] pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-6 flex items-center gap-3">
          <div className="from-accent/15 to-accent/5 icon-hover-glow flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br">
            <Sparkles className="text-accent icon-hover-spin h-5 w-5" />
          </div>
          <div>
            <h3 className="text-foreground text-lg font-semibold">{t('moreThings.title')}</h3>
            <p className="text-muted-foreground text-xs">{t('moreThings.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Beautiful UI Section */}
          <div>
            <h4 className="text-foreground mb-3 text-sm font-medium">{t('moreThings.beautifulUI.title')}</h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Sun, label: t('moreThings.beautifulUI.light') },
                { icon: Moon, label: t('moreThings.beautifulUI.dark') },
                { icon: MonitorSmartphone, label: t('moreThings.beautifulUI.auto') },
              ].map(item => (
                <div
                  key={item.label}
                  className="border-border/80 hover:bg-secondary/60 hover:border-accent/20 browser-icon-hover cursor-pointer rounded-lg border p-3 text-center transition-all duration-200">
                  <div className="mb-2 flex justify-center">
                    <item.icon className="text-foreground h-5 w-5" />
                  </div>
                  <div className="text-foreground text-xs font-medium">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Browser Support Section */}
          <div>
            <h4 className="text-foreground mb-3 text-sm font-medium">{t('moreThings.browserSupport.title')}</h4>
            <div className="grid grid-cols-5 gap-3">
              {[
                { src: '/chrome-icon.svg', alt: 'Chrome' },
                { src: '/edge-icon.svg', alt: 'Edge' },
                { src: '/brave-icon.svg', alt: 'Brave' },
                { src: '/opera-icon.svg', alt: 'Opera' },
                { src: '/firefox-icon.svg', alt: 'Firefox' },
              ].map(browser => (
                <div
                  key={browser.alt}
                  className="bg-secondary/60 border-border/80 hover:bg-muted hover:border-accent/20 browser-icon-hover flex items-center justify-center rounded-lg border p-3">
                  <div className="flex h-8 w-8 items-center justify-center">
                    <Image src={browser.src} alt={browser.alt} width={24} height={24} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5 Languages Section */}
          <div>
            <h4 className="text-foreground mb-3 text-sm font-medium">{t('moreThings.languages.title')}</h4>
            <div className="flex items-center justify-start gap-3 text-2xl">
              {['US', 'VN', 'KR', 'JP', 'CN'].map(code => (
                <span
                  key={code}
                  className="bg-secondary/60 border-border/80 hover:border-accent/20 browser-icon-hover flex h-10 w-10 items-center justify-center rounded-lg border text-base">
                  {code === 'US' && '\u{1F1FA}\u{1F1F8}'}
                  {code === 'VN' && '\u{1F1FB}\u{1F1F3}'}
                  {code === 'KR' && '\u{1F1F0}\u{1F1F7}'}
                  {code === 'JP' && '\u{1F1EF}\u{1F1F5}'}
                  {code === 'CN' && '\u{1F1E8}\u{1F1F3}'}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
