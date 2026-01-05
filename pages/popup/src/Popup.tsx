import { useFocusStore } from './hooks/useFocusStore';
import { useI18n } from '@extension/i18n';
import { Header, StatCard, PauseControl, Card } from '@extension/ui';
import { Clock, Ban, Globe } from 'lucide-react';
import './index.css';

const Popup = () => {
  const { t } = useI18n();
  const { settings, stats, pauseBlocking, resumeBlocking, isWithinWorkHours } = useFocusStore();

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
