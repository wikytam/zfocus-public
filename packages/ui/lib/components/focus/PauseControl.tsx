import { cn } from '../../utils';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useI18n } from '@extension/i18n';
import { Pause, Play, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { MessageKeyType } from '@extension/i18n';

interface PauseControlProps {
  isPaused: boolean;
  pauseEndTime?: number;
  hardLockMode: boolean;
  onPause: (minutes: number) => void;
  onResume: () => void;
  compact?: boolean; // true for popup, false for options page
}

export const PauseControl = ({
  isPaused,
  pauseEndTime,
  hardLockMode,
  onPause,
  onResume,
  compact = false,
}: PauseControlProps) => {
  const { t } = useI18n();
  const [selectedMinutes, setSelectedMinutes] = useState('15');
  const [remainingTime, setRemainingTime] = useState<string>('');

  const PAUSE_OPTIONS = [
    { value: 5, labelKey: '5minutes' },
    { value: 10, labelKey: '10minutes' },
    { value: 15, labelKey: '15minutes' },
    { value: 30, labelKey: '30minutes' },
    { value: 60, labelKey: '1hour' },
  ];

  useEffect(() => {
    if (!isPaused || !pauseEndTime) {
      setRemainingTime('');
      return;
    }

    const updateRemaining = () => {
      const now = Date.now();
      const remaining = pauseEndTime - now;

      if (remaining <= 0) {
        setRemainingTime('0:00');
        // Don't call onResume here - let the background script handle it
        // The background script already checks pause expiration every 10 seconds
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setRemainingTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [isPaused, pauseEndTime]);

  if (hardLockMode) {
    return (
      <Card variant="bordered" className="border-warning/30 bg-warning/5 p-3">
        <div className="text-warning flex items-center gap-2.5">
          <div className="bg-warning/10 rounded-lg p-1.5">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium leading-tight">{t('hardLockMode')}</p>
            <p className="text-[11px] leading-tight opacity-80">{t('hardLockModeDesc')}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      variant="glass"
      className={cn(
        'p-3 transition-all duration-300',
        isPaused && 'border-warning/50 shadow-[0_0_15px_hsl(38_90%_50%/0.1)]',
      )}>
      {isPaused ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="gradient-accent animate-pulse-soft rounded-lg p-2">
              <Pause className="text-accent-foreground h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium leading-tight">{t('paused')}</p>
              <p className="text-muted-foreground text-xs leading-tight">
                {t('remaining')} <span className="text-warning font-mono font-semibold">{remainingTime}</span>
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onResume} className="h-8">
            <Play className="mr-1.5 h-3.5 w-3.5" />
            {t('continue')}
          </Button>
        </div>
      ) : compact ? (
        // Compact layout for popup
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-success/10 shrink-0 rounded-lg p-2">
              <Play className="text-success h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium leading-tight">{t('active')}</p>
              <p className="text-muted-foreground text-xs leading-tight">{t('blockingDistractingSites')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMinutes} onValueChange={setSelectedMinutes}>
              <SelectTrigger className="h-9 flex-1 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAUSE_OPTIONS.map(opt => (
                  <SelectItem key={`pause-${opt.value}`} value={opt.value.toString()}>
                    {t(opt.labelKey as MessageKeyType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="warning"
              size="sm"
              onClick={() => onPause(parseInt(selectedMinutes))}
              className="h-9 flex-1">
              <Pause className="mr-1.5 h-4 w-4" />
              {t('pause')}
            </Button>
          </div>
        </div>
      ) : (
        // Full layout for options page
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="bg-success/10 shrink-0 rounded-lg p-2">
              <Play className="text-success h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight">{t('active')}</p>
              <p className="text-muted-foreground truncate text-xs leading-tight">{t('blockingDistractingSites')}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Select value={selectedMinutes} onValueChange={setSelectedMinutes}>
              <SelectTrigger className="h-8 w-[110px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAUSE_OPTIONS.map(opt => (
                  <SelectItem key={`pause-${opt.value}`} value={opt.value.toString()}>
                    {t(opt.labelKey as MessageKeyType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="warning" size="sm" onClick={() => onPause(parseInt(selectedMinutes))} className="h-8">
              <Pause className="mr-1.5 h-3.5 w-3.5" />
              {t('pause')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
