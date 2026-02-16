'use client';

import { Zap, Star, XCircle, ArrowRight, Plus, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const AdvancedActionsCard = () => {
  const t = useTranslations();

  return (
    <div
      className="border-border bg-card card-hover-lift hover:border-accent/30 animate-bento-card-reveal group relative overflow-hidden rounded-2xl border p-6 opacity-0 md:col-span-6 md:p-8 lg:col-span-7"
      style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
      {/* Subtle gradient overlay */}
      <div
        className="from-accent/[0.02] pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-6 flex items-center gap-3">
          <div className="from-accent/15 to-accent/5 icon-hover-glow flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br">
            <Zap className="text-accent icon-hover-spin h-5 w-5" />
          </div>
          <div>
            <h3 className="text-foreground text-lg font-semibold">{t('advancedActions.title')}</h3>
            <p className="text-muted-foreground text-sm">{t('advancedActions.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Close Tab */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="bg-accent text-accent-foreground badge-hover-pop inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium">
                <Star className="h-3 w-3" />
                {t('advancedActions.closeTab.badge')}
              </span>
              <h4 className="text-foreground font-medium">{t('advancedActions.closeTab.title')}</h4>
            </div>
            <p className="text-muted-foreground mb-3 text-sm">{t('advancedActions.closeTab.description')}</p>
            <div className="bg-secondary/60 border-border/80 flex items-center justify-center rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <span className="text-foreground text-sm font-medium">{t('advancedActions.closeTab.demo')}</span>
                <XCircle className="text-destructive h-5 w-5" />
                <span className="text-muted-foreground text-sm">{t('advancedActions.closeTab.or')}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Redirect Link */}
            <div>
              <h4 className="text-foreground mb-3 font-medium">{t('advancedActions.redirectLink.title')}</h4>
              <p className="text-muted-foreground mb-3 text-xs">{t('advancedActions.redirectLink.description')}</p>
              <div className="bg-secondary/60 border-border/80 space-y-2.5 rounded-lg border p-4 font-mono text-sm">
                <div className="flex items-center justify-center gap-2">
                  <img src="/facebook.svg" alt="Facebook" className="h-4 w-4" />
                  <span className="text-foreground line-through opacity-50">facebook.com</span>
                  <ArrowRight className="text-muted-foreground h-4 w-4" />
                  <img src="/notion.svg" alt="Notion" className="h-4 w-4" />
                  <span className="text-accent font-semibold">notion.so</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <img src="/instagram.svg" alt="Instagram" className="h-4 w-4" />
                  <span className="text-foreground line-through opacity-50">instagram.com</span>
                  <ArrowRight className="text-muted-foreground h-4 w-4" />
                  <img src="/mail.svg" alt="Gmail" className="h-4 w-4" />
                  <span className="text-accent font-semibold">gmail.com</span>
                </div>
                <span className="text-muted-foreground flex items-center justify-center gap-2">
                  {t('advancedActions.redirectLink.more')}
                  <Plus className="text-muted-foreground h-4 w-4" />
                </span>
              </div>
            </div>

            {/* Time-Based Block */}
            <div>
              <h4 className="text-foreground mb-3 font-medium">{t('advancedActions.timeBasedBlock.title')}</h4>
              <p className="text-muted-foreground mb-3 text-xs">{t('advancedActions.timeBasedBlock.description')}</p>
              <div className="bg-secondary/60 border-border/80 space-y-2.5 rounded-lg border p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="text-accent h-4 w-4 flex-shrink-0" />
                  <span className="text-foreground">{t('advancedActions.timeBasedBlock.option1')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="text-accent h-4 w-4 flex-shrink-0" />
                  <span className="text-foreground">{t('advancedActions.timeBasedBlock.option2')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
