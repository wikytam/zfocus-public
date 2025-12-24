import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { cn } from '../lib/utils';
import type { ActiveTimer } from '../types/focus';

interface ActiveTimerDisplayProps {
  timers: ActiveTimer[];
  onCloseTimer: (siteId: string) => void;
}

export function ActiveTimerDisplay({ timers, onCloseTimer }: ActiveTimerDisplayProps) {
  const [, setTick] = useState(0);

  // Force re-render every second to update displays
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (timers.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-warning" />
        Đang theo dõi ({timers.length})
      </h3>

      {timers.map(timer => {
        const progress = (timer.remainingSeconds / timer.totalSeconds) * 100;
        const isLow = timer.remainingSeconds <= 60;
        const isCritical = timer.remainingSeconds <= 10;

        const minutes = Math.floor(timer.remainingSeconds / 60);
        const seconds = timer.remainingSeconds % 60;
        const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        return (
          <Card
            key={timer.siteId}
            variant="bordered"
            className={cn(
              'p-3 transition-all duration-300',
              isCritical && 'border-destructive/50 bg-destructive/5 animate-pulse-soft',
              isLow && !isCritical && 'border-warning/50 bg-warning/5',
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">{timer.siteName}</span>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'font-mono text-sm font-bold',
                    isCritical ? 'text-destructive' : isLow ? 'text-warning' : 'text-muted-foreground',
                  )}
                >
                  {timeDisplay}
                </span>
                <Button variant="ghost" size="icon-sm" onClick={() => onCloseTimer(timer.siteId)} className="h-6 w-6">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <Progress
              value={progress}
              className={cn(
                'h-1.5',
                isCritical && '[&>div]:bg-destructive',
                isLow && !isCritical && '[&>div]:bg-warning',
              )}
            />
          </Card>
        );
      })}
    </div>
  );
}
