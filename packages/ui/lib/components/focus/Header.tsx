import { Shield, Settings, ExternalLink } from 'lucide-react';
import { cn } from '../../utils';
import { Button } from '../ui/button';

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

      {showSettingsButton && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-8"
          onClick={openOptionsPage}
        >
          <Settings className="w-3.5 h-3.5" />
          <span className="text-xs">Cài đặt đầy đủ</span>
          <ExternalLink className="w-3 h-3 opacity-50" />
        </Button>
      )}
    </header>
  );
};
