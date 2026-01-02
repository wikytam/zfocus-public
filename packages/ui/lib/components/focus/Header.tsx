import { cn } from '../../utils';
import { Button } from '../ui/button';
import { useI18n } from '@extension/i18n';
import { Settings, ExternalLink } from 'lucide-react';

interface HeaderProps {
  isWithinWorkHours: boolean;
  isPaused: boolean;
  showSettingsButton?: boolean; // Default true for popup, false for options
}

export const Header = ({ isWithinWorkHours, isPaused, showSettingsButton = true }: HeaderProps) => {
  const { t } = useI18n();

  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
  };

  const getStatusText = () => {
    if (isPaused) return t('paused');
    if (isWithinWorkHours) return t('protecting');
    return t('outsideWorkHours');
  };

  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300')}>
            <img src="/icon-34.png" alt="ZFocus" className="h-10 w-10" />
          </div>
          {isWithinWorkHours && !isPaused && (
            <span className="bg-success animate-pulse-soft absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full" />
          )}
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight">{t('appName')}</h1>
          <p className="text-muted-foreground text-xs leading-tight">{getStatusText()}</p>
        </div>
      </div>

      {showSettingsButton && (
        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={openOptionsPage}>
          <Settings className="h-3.5 w-3.5" />
          <span className="text-xs">{t('fullSettings')}</span>
          <ExternalLink className="h-3 w-3 opacity-50" />
        </Button>
      )}
    </header>
  );
};
