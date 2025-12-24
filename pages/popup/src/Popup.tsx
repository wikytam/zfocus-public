import { useState, useEffect } from 'react';
import { Clock, Ban, Settings, ExternalLink } from 'lucide-react';
import { useFocusStore } from './hooks/useFocusStore';
import { Header } from './components/Header';
import { StatCard } from './components/StatCard';
import { PauseControl } from './components/PauseControl';
import { ActiveTimerDisplay } from './components/ActiveTimerDisplay';
import { Button } from './components/ui/button';
import './index.css';

const Popup = () => {
  const {
    settings,
    stats,
    activeTimers,
    pauseBlocking,
    resumeBlocking,
    isWithinWorkHours,
    setActiveTimers,
  } = useFocusStore();

  const withinHours = isWithinWorkHours();

  // Simulate some active timers for demo
  useEffect(() => {
    if (withinHours && !settings.isPaused) {
      setActiveTimers([
        { siteId: '1', siteName: 'facebook.com', remainingSeconds: 180, totalSeconds: 300 },
        { siteId: '2', siteName: 'youtube.com', remainingSeconds: 45, totalSeconds: 600 },
      ]);
    } else {
      setActiveTimers([]);
    }
  }, [withinHours, settings.isPaused, setActiveTimers]);

  const formatTimeSaved = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="w-[380px] min-h-[480px] max-h-[600px] bg-background overflow-y-auto">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-48 h-48 bg-accent/8 rounded-full blur-3xl" />
      </div>

      <div className="relative px-4 py-4">
        {/* Header */}
        <Header isWithinWorkHours={withinHours} isPaused={settings.isPaused} />

        {/* Dashboard Content */}
        <div className="space-y-3 mt-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Ban className="w-4 h-4" />}
              label="Lượt chặn hôm nay"
              value={stats.blockedAttempts}
              subValue="trang web"
              variant="success"
              delay={0}
            />
            <StatCard
              icon={<Clock className="w-4 h-4" />}
              label="Thời gian tiết kiệm"
              value={formatTimeSaved(stats.timeSavedMinutes)}
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

          {/* Active Timers */}
          <ActiveTimerDisplay
            timers={activeTimers}
            onCloseTimer={siteId => {
              setActiveTimers(activeTimers.filter(t => t.siteId !== siteId));
            }}
          />

          {/* Quick Info */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/50 text-sm">
            <span className="text-muted-foreground">
              Đang chặn{' '}
              <span className="font-semibold text-foreground">
                {settings.blockedSites.filter(s => s.isActive).length}
              </span>{' '}
              / {settings.blockedSites.length} nhóm
            </span>
          </div>

          {/* Open Settings Button */}
          <Button
            variant="outline"
            className="w-full gap-2 h-11"
            onClick={openOptionsPage}
          >
            <Settings className="w-4 h-4" />
            <span>Mở cài đặt đầy đủ</span>
            <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
