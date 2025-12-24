import { Shield, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface HeaderProps {
  isWithinWorkHours: boolean;
  isPaused: boolean;
}

export function Header({ isWithinWorkHours, isPaused }: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
              isPaused ? 'bg-warning/20' : isWithinWorkHours ? 'gradient-primary shadow-glow' : 'bg-secondary',
            )}
          >
            <Shield
              className={cn(
                'w-6 h-6',
                isPaused ? 'text-warning' : isWithinWorkHours ? 'text-primary-foreground' : 'text-muted-foreground',
              )}
            />
          </div>
          {isWithinWorkHours && !isPaused && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-success animate-pulse-soft" />
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">FocusGuard</h1>
          <p className="text-sm text-muted-foreground">
            {isPaused ? 'Đang tạm dừng' : isWithinWorkHours ? 'Đang bảo vệ sự tập trung' : 'Ngoài giờ làm việc'}
          </p>
        </div>
      </div>

      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300',
          isPaused
            ? 'bg-warning/10 text-warning'
            : isWithinWorkHours
              ? 'bg-success/10 text-success'
              : 'bg-secondary text-muted-foreground',
        )}
      >
        <Zap className="w-3.5 h-3.5" />
        {isPaused ? 'Tạm dừng' : isWithinWorkHours ? 'Đang hoạt động' : 'Nghỉ ngơi'}
      </div>
    </header>
  );
}
