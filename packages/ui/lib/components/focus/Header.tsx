import { cn } from '../../utils';
import { Button } from '../ui/button';
import { Shield, Settings, ExternalLink } from 'lucide-react';

interface HeaderProps {
  isWithinWorkHours: boolean;
  isPaused: boolean;
  showSettingsButton?: boolean; // Default true for popup, false for options
}

export const Header = ({ isWithinWorkHours, isPaused, showSettingsButton = true }: HeaderProps) => {
  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300',
              isPaused ? 'bg-warning/20' : isWithinWorkHours ? 'gradient-primary shadow-glow' : 'bg-secondary',
            )}>
            <Shield
              className={cn(
                'h-5 w-5',
                isPaused ? 'text-warning' : isWithinWorkHours ? 'text-primary-foreground' : 'text-muted-foreground',
              )}
            />
          </div>
          {isWithinWorkHours && !isPaused && (
            <span className="bg-success animate-pulse-soft absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full" />
          )}
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">FocusGuard</h1>
          <p className="text-muted-foreground text-xs leading-tight">
            {isPaused ? 'Đang tạm dừng' : isWithinWorkHours ? 'Đang bảo vệ sự tập trung' : 'Ngoài giờ làm việc'}
          </p>
        </div>
      </div>

      {showSettingsButton && (
        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={openOptionsPage}>
          <Settings className="h-3.5 w-3.5" />
          <span className="text-xs">Cài đặt đầy đủ</span>
          <ExternalLink className="h-3 w-3 opacity-50" />
        </Button>
      )}
    </header>
  );
};
