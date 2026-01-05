import { Navigation } from './components/Navigation';
import { SettingsPanel } from './components/SettingsPanel';
import { useFocusStore } from './hooks/useFocusStore';
import { useI18n } from '@extension/i18n';
import { Header, StatCard, PauseControl, BlockedSiteItem, AddSiteDialog, Card } from '@extension/ui';
import { Ban, Clock, Globe } from 'lucide-react';
import { useState } from 'react';
import './index.css';

type TabType = 'dashboard' | 'sites' | 'settings';

const Options = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>('sites');
  const {
    settings,
    stats,
    updateSettings,
    addBlockedSite,
    updateBlockedSite,
    removeBlockedSite,
    pauseBlocking,
    resumeBlocking,
    isWithinWorkHours,
  } = useFocusStore();

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
    return site ? t(site.title) : siteId;
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-primary/5 absolute right-0 top-0 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/2 transform rounded-full blur-3xl" />
        <div className="bg-accent/5 absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/2 translate-y-1/2 transform rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-2xl px-6 py-8">
        <Header isWithinWorkHours={withinHours} isPaused={settings.isPaused} showSettingsButton={false} />

        <div className="my-4 flex justify-center">
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
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
              <AddSiteDialog onAdd={addBlockedSite} />
            </div>

            <div className="space-y-4">
              {settings.blockedSites.map((site, index) => (
                <BlockedSiteItem
                  key={site.id}
                  site={site}
                  onUpdate={updateBlockedSite}
                  onRemove={removeBlockedSite}
                  delay={index * 50}
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
            <SettingsPanel settings={settings} onUpdate={updateSettings} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Options;
