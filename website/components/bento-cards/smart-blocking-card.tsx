'use client';

import { Shield, Star, XCircle, CheckCircle2, AlertTriangle, Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const SmartBlockingCard = () => {
  const t = useTranslations();

  return (
    <div
      className="border-border bg-card card-hover-lift hover:border-accent/30 animate-bento-card-reveal group relative overflow-hidden rounded-2xl border p-6 opacity-0 md:col-span-8 md:p-8"
      style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
      {/* Subtle gradient overlay */}
      <div
        className="from-accent/[0.02] pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="from-accent/15 to-accent/5 icon-hover-glow flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br">
            <Shield className="text-accent icon-hover-spin h-5 w-5" />
          </div>
          <div>
            <h3 className="text-foreground text-lg font-semibold">{t('smartBlocking.title')}</h3>
            <p className="text-muted-foreground text-sm">{t('smartBlocking.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Exception Pattern */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="bg-accent text-accent-foreground badge-hover-pop inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium">
                <Star className="h-3 w-3" />
                {t('smartBlocking.exceptionPattern.badge')}
              </span>
              <h4 className="text-foreground font-medium">{t('smartBlocking.exceptionPattern.title')}</h4>
            </div>
            <div className="bg-secondary/60 border-border/80 space-y-2.5 rounded-xl border p-4 font-mono text-sm">
              <div className="flex items-center gap-2">
                <XCircle className="text-destructive h-4 w-4 flex-shrink-0" />
                <span className="text-foreground">{t('smartBlocking.exceptionPattern.block')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-accent h-4 w-4 flex-shrink-0" />
                <span className="text-accent">{t('smartBlocking.exceptionPattern.allow1')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-accent h-4 w-4 flex-shrink-0" />
                <span className="text-accent">{t('smartBlocking.exceptionPattern.allow2')}</span>
              </div>
            </div>
            <p className="text-muted-foreground mt-2.5 text-sm">{t('smartBlocking.exceptionPattern.description')}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Referrer Blocking */}
            <div>
              <h4 className="text-foreground mb-3 font-medium">{t('smartBlocking.referrerBlocking.title')}</h4>
              <div className="space-y-2">
                {[
                  { src: '/facebook.svg', alt: 'Facebook', name: 'facebook.com' },
                  { src: '/x.svg', alt: 'X', name: 'x.com' },
                  { src: '/instagram.svg', alt: 'Instagram', name: 'instagram.com' },
                ].map(item => (
                  <div
                    key={item.alt}
                    className="bg-background border-border/80 hover:border-accent/30 row-hover-highlight flex items-center gap-2 rounded-lg border p-2.5">
                    <div className="flex flex-1 items-center gap-2">
                      <img src={item.src} alt={item.alt} className="h-4 w-4" />
                      <span className="text-foreground text-sm font-medium">{item.name}</span>
                    </div>
                    <Globe className="text-muted-foreground h-3.5 w-3.5" />
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground mt-2 text-xs">{t('smartBlocking.referrerBlocking.description')}</p>
            </div>

            {/* Keyword Blocking */}
            <div>
              <h4 className="text-foreground mb-3 font-medium">{t('smartBlocking.keywordBlocking.title')}</h4>
              <div className="space-y-2">
                {[
                  { prefix: 'example.com/', keyword: 'game', suffix: '/play' },
                  { prefix: 'store.com/', keyword: 'shopping', suffix: '/cart' },
                  { prefix: 'watch.com/', keyword: 'streaming', suffix: '/live' },
                ].map(item => (
                  <div
                    key={item.keyword}
                    className="bg-background border-destructive/10 flex items-center gap-2 rounded-lg border p-2.5">
                    <div className="flex flex-1 items-center gap-2">
                      <AlertTriangle className="text-destructive h-3.5 w-3.5 flex-shrink-0" />
                      <span className="text-foreground font-mono text-sm">
                        {item.prefix}
                        <span className="text-destructive font-bold">{item.keyword}</span>
                        {item.suffix}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground mt-2 text-xs">{t('smartBlocking.keywordBlocking.description')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
