import { useFocusStore } from './hooks/useFocusStore';
import { Header, StatCard, PauseControl } from '@extension/ui';
import { Clock, Ban } from 'lucide-react';
import './index.css';

const Popup = () => {
  const { settings, stats, pauseBlocking, resumeBlocking, isWithinWorkHours } = useFocusStore();

  const withinHours = isWithinWorkHours();

  const formatTimeSaved = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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
              label="Lượt chặn hôm nay"
              value={stats.blockedAttempts}
              subValue="trang web"
              variant="success"
              delay={0}
            />
            <StatCard
              icon={<Clock className="h-4 w-4" />}
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
        </div>
      </div>
    </div>
  );
};

export default Popup;
