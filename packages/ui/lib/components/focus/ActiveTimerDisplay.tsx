import { cn } from '../../utils';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ActiveTimer } from '@extension/storage';

interface ActiveTimerDisplayProps {
  timers: ActiveTimer[];
  onCloseTimer: (siteId: string) => void;
}

export const ActiveTimerDisplay = ({ timers, onCloseTimer }: ActiveTimerDisplayProps) => {
  const [, setTick] = useState(0);

  // Force re-render every second to update displays
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  if (timers.length === 0) return null;

  return (
    <div className="space-y-2">
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
              'p-2.5 transition-all duration-300',
              isCritical && 'border-destructive/50 bg-destructive/5 animate-pulse-soft',
              isLow && !isCritical && 'border-warning/50 bg-warning/5',
            )}>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium">{timer.siteName}</span>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'font-mono text-xs font-bold',
                    isCritical ? 'text-destructive' : isLow ? 'text-warning' : 'text-muted-foreground',
                  )}>
                  {timeDisplay}
                </span>
                <Button variant="ghost" size="icon-sm" onClick={() => onCloseTimer(timer.siteId)} className="h-5 w-5">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Progress
              value={progress}
              className={cn(
                'h-1',
                isCritical && '[&>div]:bg-destructive',
                isLow && !isCritical && '[&>div]:bg-warning',
              )}
            />
          </Card>
        );
      })}
    </div>
  );
};
