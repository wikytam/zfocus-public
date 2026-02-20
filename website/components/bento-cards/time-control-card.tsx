'use client';

import { Clock, Calendar, Target, CheckCircle2, XCircle, Pause } from 'lucide-react';
import { useTranslations } from 'next-intl';

export const TimeControlCard = () => {
  const t = useTranslations();

  return (
    <div
      className="border-border bg-card card-hover-lift hover:border-accent/30 animate-bento-card-reveal group relative overflow-hidden rounded-2xl border p-6 opacity-0 md:col-span-4 md:p-8"
      style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
      {/* Subtle gradient overlay */}
      <div
        className="from-foreground/[0.01] pointer-events-none absolute inset-0 bg-gradient-to-b to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-5 flex items-center gap-3">
          <div className="bg-foreground text-primary-foreground icon-hover-glow flex h-10 w-10 items-center justify-center rounded-xl shadow-sm">
            <Clock className="icon-hover-spin h-5 w-5" />
          </div>
          <div>
            <h3 className="text-foreground text-lg font-semibold">{t('timeControl.title')}</h3>
            <p className="text-muted-foreground text-xs">{t('timeControl.subtitle')}</p>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <h4 className="text-foreground mb-2 flex items-center gap-2 text-sm font-medium">
              <Calendar className="text-muted-foreground h-4 w-4" />
              {t('timeControl.schedule.title')}
            </h4>
            <div className="bg-secondary/60 border-border/80 space-y-2 rounded-lg border p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground font-medium">{t('timeControl.schedule.monFri')}</span>
                <span className="text-muted-foreground font-mono text-xs">9:00-17:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground font-medium">{t('timeControl.schedule.satSun')}</span>
                <span className="text-muted-foreground font-mono text-xs">{t('timeControl.schedule.off')}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-foreground mb-2 flex items-center gap-2 text-sm font-medium">
              <Target className="text-muted-foreground h-4 w-4" />
              {t('timeControl.activeTabOnly.title')}
            </h4>
            <div className="bg-secondary/60 border-border/80 space-y-1.5 rounded-lg border p-3 text-xs">
              <div className="flex items-center gap-2">
                <XCircle className="text-destructive h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-foreground">{t('timeControl.activeTabOnly.blockActive')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-accent h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-muted-foreground">{t('timeControl.activeTabOnly.allowBackground')}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-foreground mb-2 flex items-center gap-2 text-sm font-medium">
              <Pause className="text-muted-foreground h-4 w-4" />
              {t('timeControl.quickPause.title')}
            </h4>
            <p className="text-muted-foreground text-xs leading-relaxed">{t('timeControl.quickPause.description')}</p>
          </div>

          <div className="border-border border-t pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/60 border-border/80 stat-hover-pop rounded-lg border p-3 text-center">
                <div className="text-foreground text-2xl font-bold">12</div>
                <div className="text-muted-foreground text-xs">{t('statistics.blocksToday')}</div>
              </div>
              <div className="bg-secondary/60 border-border/80 stat-hover-pop rounded-lg border p-3 text-center">
                <div className="text-foreground text-2xl font-bold">2.5h</div>
                <div className="text-muted-foreground text-xs">{t('statistics.timeSaved')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
