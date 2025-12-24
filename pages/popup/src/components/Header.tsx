import { Shield, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface HeaderProps {
  isWithinWorkHours: boolean;
  isPaused: boolean;
}

export function Header({ isWithinWorkHours, isPaused }: HeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300',
              isPaused ? 'bg-warning/20' : isWithinWorkHours ? 'gradient-primary shadow-glow' : 'bg-secondary',
            )}
          >
            <Shield
              className={cn(
                'w-5 h-5',
                isPaused ? 'text-warning' : isWithinWorkHours ? 'text-primary-foreground' : 'text-muted-foreground',
              )}
            />
          </div>
          {isWithinWorkHours && !isPaused && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success animate-pulse-soft" />
          )}
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight leading-tight">FocusGuard</h1>
          <p className="text-xs text-muted-foreground leading-tight">
            {isPaused ? 'Đang tạm dừng' : isWithinWorkHours ? 'Đang bảo vệ sự tập trung' : 'Ngoài giờ làm việc'}
          </p>
        </div>
      </div>

      <div
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-300',
          isPaused
            ? 'bg-warning/10 text-warning'
            : isWithinWorkHours
              ? 'bg-success/10 text-success'
              : 'bg-secondary text-muted-foreground',
        )}
      >
        <Zap className="w-3 h-3" />
        {isPaused ? 'Tạm dừng' : isWithinWorkHours ? 'Hoạt động' : 'Nghỉ'}
      </div>
    </header>
  );
}
