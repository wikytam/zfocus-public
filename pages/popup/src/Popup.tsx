import { useI18n } from '@extension/i18n';
import { useFocusStore } from '@extension/shared';
import { Header, StatCard, PauseControl, Card, Button } from '@extension/ui';
import { Clock, Ban, Globe, Sparkles, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import './index.css';

const ONBOARDING_COMPLETED_KEY = 'zfocus-onboarding-completed';

const Popup = () => {
  const { t } = useI18n();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const {
    settings,
    stats,
    loading,
    pauseBlocking,
    resumeBlocking,
    isWithinWorkHours,
    loadInitialData,
    loadHistoricalStats,
    setupListeners,
  } = useFocusStore();

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const result = await chrome.storage.local.get(ONBOARDING_COMPLETED_KEY);
        setNeedsOnboarding(!result[ONBOARDING_COMPLETED_KEY]);
      } catch (e) {
        console.error('[ZFocus] Failed to check onboarding status:', e);
        setNeedsOnboarding(false);
      }
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    loadInitialData();
    loadHistoricalStats();
    const cleanup = setupListeners();
    return cleanup;
  }, [loadInitialData, loadHistoricalStats, setupListeners]);

  useEffect(() => {
    if (loading) return;

    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme, loading]);

  const withinHours = isWithinWorkHours();

  // Show loading state while checking onboarding
  if (needsOnboarding === null) {
    return (
      <div className="bg-background flex min-h-[300px] w-[380px] items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  // Show onboarding prompt if user hasn't completed setup
  if (needsOnboarding) {
    return (
      <div className="bg-background min-h-[300px] w-[380px] overflow-hidden">
        {/* Decorative background */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="bg-primary/10 absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl" />
          <div className="bg-accent/10 absolute -bottom-20 -left-20 h-32 w-32 rounded-full blur-3xl" />
        </div>

        <div className="relative flex min-h-[300px] flex-col items-center justify-center px-6 py-8 text-center">
          <div className="bg-primary/10 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
            <Sparkles className="text-primary h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">{t('welcomeToZFocus')}</h2>
          <p className="text-muted-foreground mb-6 text-sm">{t('setupRequiredDesc')}</p>
          <Button
            onClick={() => chrome.runtime.openOptionsPage()}
            className="gradient-primary text-primary-foreground gap-2">
            {t('startSetup')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const formatTimePause = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes < 60) return `${minutes}m ${secs}s`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTimeOnWebsite = (sitesAccessed: Record<string, number>) => {
    const totalSeconds = Object.values(sitesAccessed).reduce((sum, seconds) => sum + seconds, 0);
    return formatTime(totalSeconds);
  };

  const getSiteName = (siteId: string) => {
    const site = settings.blockedSites.find(s => s.id === siteId);
    return site ? t(site.title as keyof typeof t) : siteId;
  };

  return (
    <div className="bg-background min-h-[300px] w-[380px] overflow-y-auto">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-primary/8 absolute -right-32 -top-32 h-64 w-64 rounded-full blur-3xl" />
        <div className="bg-accent/8 absolute -bottom-32 -left-32 h-48 w-48 rounded-full blur-3xl" />
      </div>

      <div className="relative px-4 py-4">
        {/* Header */}
        <Header isWithinWorkHours={withinHours} isPaused={settings.isPaused} />

        {/* Dashboard Content */}
        <div className="mt-4 space-y-3">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Ban className="h-4 w-4" />}
              label={t('blocksToday')}
              value={stats.blockedAttempts}
              subValue={t('websites')}
              variant="success"
              delay={0}
            />
            <StatCard
              icon={<Clock className="h-4 w-4" />}
              label={t('timePause')}
              value={formatTimePause(stats.timePausedSeconds)}
              variant="accent"
              delay={100}
            />
          </div>

          {/* Pause Control */}
          <PauseControl
            isPaused={settings.isPaused}
            pauseEndTime={settings.pauseEndTime}
            hardLockMode={settings.hardLockMode}
            onPause={pauseBlocking}
            onResume={resumeBlocking}
            compact={true}
          />

          {/* Time on Website */}
          <Card variant="glass" className="p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="bg-primary/10 rounded-lg p-1.5">
                <Globe className="text-primary h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{t('timeOnWebsite')}</p>
                <p className="text-muted-foreground text-xs">{formatTimeOnWebsite(stats.sitesAccessed)}</p>
              </div>
            </div>
            {Object.keys(stats.sitesAccessed).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(stats.sitesAccessed).map(([siteId, seconds]) => (
                  <div
                    key={siteId}
                    className="bg-primary/10 text-primary flex items-center gap-1 rounded-md px-2 py-1 text-xs">
                    <span className="font-medium">{getSiteName(siteId)}</span>
                    <span className="text-primary/70">·</span>
                    <span className="text-primary/90">{formatTime(seconds)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Popup;
