import { useI18n } from '@extension/i18n';
import { cn } from '@extension/ui';
import { LayoutDashboard, Settings, Globe } from 'lucide-react';

type TabType = 'dashboard' | 'sites' | 'settings';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const { t } = useI18n();

  const tabs = [
    { id: 'dashboard' as const, labelKey: 'overview', icon: LayoutDashboard },
    { id: 'sites' as const, labelKey: 'websites', icon: Globe },
    { id: 'settings' as const, labelKey: 'settings', icon: Settings },
  ];

  return (
    <nav className="bg-secondary/50 flex items-center gap-1 rounded-xl p-1.5 backdrop-blur-sm">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200',
            activeTab === tab.id
              ? 'gradient-primary text-primary-foreground shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
          )}>
          <tab.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{t(tab.labelKey)}</span>
        </button>
      ))}
    </nav>
  );
};
