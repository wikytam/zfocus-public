import { useState, useEffect } from 'react';
import { Pause, Play, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '../lib/utils';

interface PauseControlProps {
  isPaused: boolean;
  pauseEndTime?: number;
  hardLockMode: boolean;
  onPause: (minutes: number) => void;
  onResume: () => void;
}

const PAUSE_OPTIONS = [
  { value: 5, label: '5 phút' },
  { value: 10, label: '10 phút' },
  { value: 15, label: '15 phút' },
  { value: 30, label: '30 phút' },
  { value: 60, label: '1 giờ' },
];

export function PauseControl({ isPaused, pauseEndTime, hardLockMode, onPause, onResume }: PauseControlProps) {
  const [selectedMinutes, setSelectedMinutes] = useState('15');
  const [remainingTime, setRemainingTime] = useState<string>('');

  useEffect(() => {
    if (!isPaused || !pauseEndTime) {
      setRemainingTime('');
      return;
    }

    const updateRemaining = () => {
      const now = Date.now();
      const remaining = pauseEndTime - now;

      if (remaining <= 0) {
        onResume();
        return;
      }

      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setRemainingTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [isPaused, pauseEndTime, onResume]);

  if (hardLockMode) {
    return (
      <Card variant="bordered" className="p-3 border-warning/30 bg-warning/5">
        <div className="flex items-center gap-2.5 text-warning">
          <div className="p-1.5 rounded-lg bg-warning/10">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium leading-tight">Chế độ khóa cứng</p>
            <p className="text-[11px] opacity-80 leading-tight">Không thể tạm dừng</p>
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
      )}
    >
      {isPaused ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg gradient-accent animate-pulse-soft">
              <Pause className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium leading-tight">Đang tạm dừng</p>
              <p className="text-xs text-muted-foreground leading-tight">
                Còn <span className="font-mono font-semibold text-warning">{remainingTime}</span>
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onResume} className="h-8">
            <Play className="w-3.5 h-3.5 mr-1.5" />
            Tiếp tục
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-success/10">
              <Play className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium leading-tight">Đang hoạt động</p>
              <p className="text-xs text-muted-foreground leading-tight">Chặn trang web xao nhãng</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Select value={selectedMinutes} onValueChange={setSelectedMinutes}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAUSE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value.toString()}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="warning" size="sm" onClick={() => onPause(parseInt(selectedMinutes))} className="h-8">
              <Pause className="w-3.5 h-3.5 mr-1.5" />
              Dừng
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
