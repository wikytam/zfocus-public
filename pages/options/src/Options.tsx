import { Navigation } from './components/Navigation';
import { SettingsPanel } from './components/SettingsPanel';
import { useI18n } from '@extension/i18n';
import { useFocusStore } from '@extension/shared';
import {
  Header,
  StatCard,
  PauseControl,
  BlockedSiteItem,
  AddSiteDialog,
  Card,
  StatsChart,
  SeedDataButton,
  OnboardingWizard,
} from '@extension/ui';
import { Ban, Clock, Globe } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import './index.css';

const ONBOARDING_COMPLETED_KEY = 'zfocus-onboarding-completed';

type TabType = 'dashboard' | 'sites' | 'settings';

const Options = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>('sites');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const {
    settings,
    stats,
    historicalStats,
    loading,
    isPremium,
    updateSettings,
    addBlockedSite,
    updateBlockedSite,
    removeBlockedSite,
    pauseBlocking,
    resumeBlocking,
    isWithinWorkHours,
    loadInitialData,
    loadHistoricalStats,
    loadPremiumStatus,
    activatePremium,
    setupListeners,
  } = useFocusStore();

  // Check if onboarding should be shown
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const result = await chrome.storage.local.get(ONBOARDING_COMPLETED_KEY);
        console.log('[ZFocus] checkOnboarding: key =', ONBOARDING_COMPLETED_KEY);
        console.log('[ZFocus] checkOnboarding: result =', result);
        console.log('[ZFocus] checkOnboarding: value =', result[ONBOARDING_COMPLETED_KEY]);
        if (!result[ONBOARDING_COMPLETED_KEY]) {
          console.log('[ZFocus] checkOnboarding: Showing onboarding wizard');
          setShowOnboarding(true);
        } else {
          console.log('[ZFocus] checkOnboarding: Onboarding already completed');
        }
      } catch (e) {
        console.error('[ZFocus] Failed to check onboarding status:', e);
      }
      setOnboardingChecked(true);
    };
    checkOnboarding();
  }, []);

  const handleOnboardingComplete = useCallback(async () => {
    try {
      // Note: Do NOT clear blocked sites here - user may have added a site during onboarding
      // The seed data is only added on first install before onboarding completes
      await chrome.storage.local.set({ [ONBOARDING_COMPLETED_KEY]: true });
    } catch (e) {
      console.error('[ZFocus] Failed to save onboarding status:', e);
    }
    setShowOnboarding(false);
  }, []);

  const handleOnboardingLanguageChange = useCallback(
    (language: string) => {
      updateSettings({ language });
    },
    [updateSettings],
  );

  // Read tab from URL query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'overview' || tab === 'dashboard') {
      setActiveTab('dashboard');
    } else if (tab === 'websites' || tab === 'sites') {
      setActiveTab('sites');
    } else if (tab === 'settings') {
      setActiveTab('settings');
    }
  }, []);

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const tabName = tab === 'dashboard' ? 'overview' : tab === 'sites' ? 'websites' : 'settings';
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabName);
    window.history.pushState({}, '', url.toString());
  };

  useEffect(() => {
    loadInitialData();
    loadHistoricalStats();
    loadPremiumStatus();
    const cleanup = setupListeners();
    return cleanup;
  }, [loadInitialData, loadHistoricalStats, loadPremiumStatus, setupListeners]);

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

  // Don't render until onboarding check is complete
  if (!onboardingChecked) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
          onLanguageChange={handleOnboardingLanguageChange}
          onAddSite={addBlockedSite}
          currentLanguage={settings.language}
          isPremium={isPremium}
          onActivatePremium={activatePremium}
        />
      )}

      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-primary/5 absolute right-0 top-0 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/2 transform rounded-full blur-3xl" />
        <div className="bg-accent/5 absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/2 translate-y-1/2 transform rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-6 py-8">
        <Header isWithinWorkHours={withinHours} isPaused={settings.isPaused} showSettingsButton={false} />

        <div className="my-4 flex justify-center">
          <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={<Ban className="h-5 w-5" />}
                label={t('blocksToday')}
                value={stats.blockedAttempts}
                subValue={t('websites')}
                variant="success"
                delay={0}
              />
              <StatCard
                icon={<Clock className="h-5 w-5" />}
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
            />

            {/* Time on Website */}
            <Card variant="glass" className="p-4">
              <div className="mb-3 flex items-center gap-2.5">
                <div className="bg-primary/10 rounded-lg p-2">
                  <Globe className="text-primary h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{t('timeOnWebsite')}</p>
                  <p className="text-muted-foreground text-xs">{formatTimeOnWebsite(stats.sitesAccessed)}</p>
                </div>
              </div>
              {Object.keys(stats.sitesAccessed).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.sitesAccessed).map(([siteId, seconds]) => (
                    <div
                      key={siteId}
                      className="bg-primary/10 text-primary flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm">
                      <span className="font-medium">{getSiteName(siteId)}</span>
                      <span className="text-primary/70">·</span>
                      <span className="text-primary/90">{formatTime(seconds)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Stats Chart */}
            <StatsChart
              historicalStats={historicalStats}
              currentStats={{
                blockedAttempts: stats.blockedAttempts,
                timePausedSeconds: stats.timePausedSeconds,
              }}
              currentDate={stats.date}
              weekStartsOn={settings.weekStartsOn}
            />
          </div>
        )}

        {/* Sites Tab */}
        {activeTab === 'sites' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{t('manageWebsites')}</h2>
                <p className="text-muted-foreground text-sm">{t('manageWebsitesDesc')}</p>
              </div>
              <AddSiteDialog onAdd={addBlockedSite} isPremium={isPremium} onActivatePremium={activatePremium} />
            </div>

            <div className="space-y-4">
              {settings.blockedSites.map((site, index) => (
                <BlockedSiteItem
                  key={site.id}
                  site={site}
                  onUpdate={updateBlockedSite}
                  onRemove={removeBlockedSite}
                  delay={index * 50}
                  isPremium={isPremium}
                  onActivatePremium={activatePremium}
                />
              ))}

              {settings.blockedSites.length === 0 && (
                <div className="text-muted-foreground py-16 text-center">
                  <Ban className="mx-auto mb-4 h-16 w-16 opacity-20" />
                  <p className="text-lg">Chưa có website nào được thêm</p>
                  <p className="text-sm">Nhấn "Thêm nhóm mới" để bắt đầu</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <SettingsPanel
              settings={settings}
              onUpdate={updateSettings}
              isPremium={isPremium}
              onActivatePremium={activatePremium}
            />
          </div>
        )}
      </div>
      <SeedDataButton />
    </div>
  );
};

export default Options;
